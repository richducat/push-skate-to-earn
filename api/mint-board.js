import { Metaplex } from '@metaplex-foundation/js';
import { PublicKey, Connection, Keypair } from '@solana/web3.js';

export const config = { runtime: 'nodejs20.x' };

/**
 * Expected POST body:
 * {
 *   boardId: 'skate01',
 *   buyer: 'BUYER_PUBLIC_KEY',
 *   reference: 'REFERENCE_PUBLIC_KEY' // used to verify payment
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { boardId, buyer, reference } = req.body;

    // TODO: verify that the reference signature has been paid and matches the amount
    // For brevity, payment verification is omitted here. You should use your
    // existing verify-payment endpoint before minting.

    // Load the board metadata (replace with your own metadata URI logic)
    const boards = require('../../boards.json');
    const board = boards.find((b) => b.id === boardId);
    if (!board) throw new Error('Board not found');

    // Create a connection and wallet signer
    const connection = new Connection(process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com');
    const secret = JSON.parse(process.env.MINT_WALLET_SECRET);
    const wallet = Keypair.fromSecretKey(Uint8Array.from(secret));

    const metaplex = new Metaplex(connection);
    metaplex.useKeypair(wallet);

    // Mint the NFT
    const { nft } = await metaplex.nfts().create({
      uri: board.metadataUri,        // IPFS/Arweave metadata JSON
      name: board.name,
      sellerFeeBasisPoints: 500,    // 5% royalties on secondary sales
      maxSupply: 1,
      creators: [
        { address: new PublicKey(process.env.MERCHANT_ADDRESS), share: 10 },
        { address: new PublicKey(buyer), share: 90 },
      ],
    });

    res.status(200).json({ ok: true, mintAddress: nft.address.toBase58() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mint failed' });
  }
}
