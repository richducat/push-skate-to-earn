import { z } from "zod";
import { verifyJWT, readJSON, writeJSON } from "../utils/server/common.js";

export const config = { runtime: "nodejs20.x" };

const Schema = z.object({
  email: z.string().email(),
  twitter: z.string().max(80).optional(),
  ref: z.string().max(20).optional(),
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const claims = verifyJWT(token);
    if (!claims?.sub) return res.status(401).json({ error: "unauthorized" });
    const address = claims.sub;

    const parsed = Schema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: "bad_input" });

    const db = await readJSON("airdrop.json", { entries: [] });
    const existsIdx = db.entries.findIndex((e) => e.address === address);
    const entry = { address, ...parsed.data, createdAt: Date.now() };
    if (existsIdx >= 0) db.entries[existsIdx] = entry; else db.entries.push(entry);
    await writeJSON("airdrop.json", db);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "register_failed" });
  }
}
