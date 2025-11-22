import { put, list } from "@vercel/blob";
import jwt from "jsonwebtoken";

const BLOB_BUCKET = process.env.BLOB_BUCKET || "push-data";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-not-for-prod";

export async function readJSON(name, def) {
  try {
    const prefix = `${BLOB_BUCKET}/${name}`;
    const { blobs } = await list({ prefix });
    if (!blobs || blobs.length === 0) return def;
    const res = await fetch(blobs[0].url);
    const text = await res.text();
    return JSON.parse(text);
  } catch (e) {
    return def;
  }
}

export async function writeJSON(name, obj) {
  const path = `${BLOB_BUCKET}/${name}`;
  const json = JSON.stringify(obj, null, 2);
  await put(path, json, { contentType: "application/json", access: "public", addRandomSuffix: false });
  return true;
}

export function makeJWT(payload, expSec = 60 * 60 * 24 * 7) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expSec });
}
export function verifyJWT(token) {
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
}
