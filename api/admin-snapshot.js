import { readJSON } from "../utils/server/common.js";

export const config = { runtime: "nodejs20.x" };

export default async function handler(req, res) {
  try {
    const key = req.headers['x-admin-key'] || req.query.key;
    const ADM = process.env.ADMIN_KEY || 'change-me';
    if (key !== ADM) return res.status(401).json({ error: "unauthorized" });
    const points = await readJSON("points.json", { users: {} });
    const airdrop = await readJSON("airdrop.json", { entries: [] });
    res.json({ points, airdrop, generatedAt: Date.now() });
  } catch (e) {
    res.status(500).json({ error: "snapshot_failed" });
  }
}
