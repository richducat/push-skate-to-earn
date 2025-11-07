// api/boards.js
import { promises as fs } from 'fs';
import path from 'path';

export const config = { runtime: "nodejs20.x" };

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'boards.json');
  const data = await fs.readFile(filePath, 'utf-8');
  const boards = JSON.parse(data);
  res.status(200).json(boards);
}
