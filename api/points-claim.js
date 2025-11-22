import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import { verifyJWT, readJSON, writeJSON } from "../utils/server/common.js";

export const config = { runtime: "nodejs20.x" };

const Schema = z.object({
  proof: z.object({
    wallet: z.string(),
    distanceMeters: z.number().min(0).max(100000),
    seconds: z.number().min(1).max(21600),
    avgKmh: z.number().min(0).max(60),
    energyUsed: z.number().min(0).max(5),
    device: z.string().max(200),
    startedAt: z.number(),
    endedAt: z.number(),
  }),
  signature: z.string(),
});

function score(proof) {
  const base = proof.seconds * 0.6;
  const speed = proof.avgKmh;
  const speedMult = speed < 6 ? (speed/6)*0.6 : speed > 25 ? (25/speed)*0.6 : 1 + (speed-6)/28;
  const energyMult = Math.max(0.25, Math.min(1, proof.energyUsed/5));
  return Math.round(base * speedMult * energyMult);
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const claims = verifyJWT(token);
    if (!claims?.sub) return res.status(401).json({ error: "unauthorized" });

    const parsed = Schema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: "bad_input" });
    const { proof, signature } = parsed.data;

    const signer = new PublicKey(proof.wallet);
    const msg = new TextEncoder().encode(JSON.stringify(proof));
    const sig = Buffer.from(signature, 'base64');
    const ok = nacl.sign.detached.verify(msg, sig, signer.toBytes());
    if (!ok) return res.status(401).json({ error: "bad_signature" });

    const avgMps = (proof.distanceMeters / proof.seconds);
    if (avgMps > 12) return res.status(400).json({ error: "unrealistic_speed" });
    if (proof.endedAt - proof.startedAt < proof.seconds*1000 - 10000) return res.status(400).json({ error: "bad_timing" });

    const db = await readJSON("points.json", { users: {} });
    const current = db.users[proof.wallet]?.points || 0;
    const delta = Math.max(1, score(proof));
    const total = current + delta;
    db.users[proof.wallet] = { points: total, updatedAt: Date.now() };
    await writeJSON("points.json", db);

    res.json({ ok: true, delta, total });
  } catch (e) {
    res.status(500).json({ error: "claim_failed" });
  }
}
