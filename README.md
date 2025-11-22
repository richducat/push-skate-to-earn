# PUSH — Skate-to-Earn (Solana) — Launch-Ready (devnet)

**Skate, earn points, climb the leaderboard, and register for the PUSH airdrop.**
- Wallet connect (Phantom)
- SIWS (sign-in-with-solana) challenge + verify
- Airdrop registration (email + Twitter + referral)
- Off-chain PUSH Points (serverless anti-cheat scoring)
- Leaderboard
- NFT Board mint stub (wire Metaplex when ready)
- Deploy on **Vercel** (recommended)

## Quick Start
```bash
npm i
npm run dev
```

## Deploy (Vercel)
1) Push this repo to your GitHub.
2) Import into Vercel → Framework: **Vite**. Point the production domain to **https://push-skate-to-earn.vercel.app/** and connect this GitHub repo so pushes to `main` auto-promote to production.
3) **Add Environment Variables** (Project → Settings → Environment Variables):
   - `JWT_SECRET` = a long random string
   - `BLOB_READ_WRITE_TOKEN` = token from https://vercel.com/docs/storage/vercel-blob
   - `BLOB_BUCKET` = `push-data` (or your custom folder)
4) Deploy. The serverless API lives under `/api/*`. A SPA rewrite is already defined in `vercel.json` so any non-API path renders `index.html` (deep links work on production without manual rewrites).

## Endpoints
- `GET /api/siws-challenge?address=...` → message to sign
- `POST /api/siws-verify` → returns `{address, token}` (JWT)
- `POST /api/airdrop/register` (auth: Bearer JWT) → save signup
- `POST /api/points/claim` (auth: Bearer JWT) → verify signed ride proof and add points
- `GET /api/leaderboard` → top wallets + points

## NFT Mint (devnet)
Use Metaplex or Candy Machine. Add `api/nft/mint.js` using your collection authority & devnet RPC.
Store board attrs (speed/control/luck/durability) in metadata JSON.

## Airdrop Plan (starter)
- **PUSH Points** accrue via verified rides & referrals.
- On TGE, convert points → PUSH using a ruleset snapshot (`/api/admin/snapshot` you add).
- Restrict regions as needed; show Terms (not financial advice).

## Security / Anti-cheat
- Speed cap, session timing checks, signed ride proof.
- Add device motion checks & heuristics as you evolve.
- Start on **devnet**; audit before mainnet/token launch.

## License
MIT
