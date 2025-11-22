export const config = { runtime: "nodejs20.x" };

export default async function handler(req, res) {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ error: "address required" });
    const expires = Math.floor(Date.now() / 1000) + 300;
    const nonce = Math.random().toString(36).slice(2,10);
    const message = `PUSH SIWS v1\nAddress: ${address}\nNonce: ${nonce}\nExpires: ${expires}`;
    res.json({ message, expires });
  } catch (e) {
    res.status(500).json({ error: "challenge_failed" });
  }
}
