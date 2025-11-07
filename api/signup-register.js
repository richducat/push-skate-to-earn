import { z } from "zod";
import { readJSON, writeJSON } from "../utils/server/common.js";

export const config = { runtime: "nodejs20.x" };

const Schema = z.object({
  wallet: z.string().min(32),
  name: z.string().max(80),
  email: z.string().email(),
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const parsed = Schema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: "bad_input" });
    const { wallet, name, email } = parsed.data;
    const db = await readJSON("signup.json", { entries: [] });
    const idx = db.entries.findIndex((e) => e.wallet === wallet);
    const entry = { wallet, name, email, createdAt: Date.now() };
    if (idx >= 0) db.entries[idx] = entry; else db.entries.push(entry);
    await writeJSON("signup.json", db);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "signup_failed" });
  }
}
