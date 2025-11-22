import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { makeJWT } from "../utils/server/common.js";

export const config = { runtime: "nodejs20.x" };

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const { address, message, signature } = req.body || {};
    if (!address || !message || !signature) return res.status(400).json({ error: "missing_fields" });

    const signer = new PublicKey(address);
    const msgBytes = new TextEncoder().encode(message);
    const sigBytes = Buffer.from(signature, 'base64');

    const ok = nacl.sign.detached.verify(msgBytes, sigBytes, signer.toBytes());
    if (!ok) return res.status(401).json({ error: "bad_signature" });

    const expMatch = /Expires:\\s*(\\d+)/.exec(message);
    if (!expMatch) return res.status(400).json({ error: "no_exp" });
    const expTs = Number(expMatch[1]);
    if (Number.isNaN(expTs) || expTs * 1000 < Date.now()) return res.status(401).json({ error: "expired" });

    const token = makeJWT({ sub: address, scope: ["user"] });
    res.json({ address, token });
  } catch (e) {
    res.status(500).json({ error: "verify_failed" });
  }
}
