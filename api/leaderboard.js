import { readJSON } from "../utils/server/common.js";

export const config = { runtime: "nodejs20.x" };

export default async function handler(req, res) {
  try {
    const db = await readJSON("points.json", { users: {} });
    const items = Object.entries(db.users).map(([address, v]) => ({ address, points: v.points || 0 }));
    items.sort((a,b) => b.points - a.points);
    res.json({ items: items.slice(0, 100) });
  } catch (e) {
    res.status(500).json({ error: "leaderboard_failed" });
  }
}
