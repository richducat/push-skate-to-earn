import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { encodeURL, createQR } from '@solana/pay';

const PUSH_MINT    = import.meta.env.VITE_PUSH_MINT;
const MERCHANT     = import.meta.env.VITE_MERCHANT_WALLET || 'wallett.sol';
const DISCOUNT_BPS = Number(import.meta.env.VITE_PUSH_DISCOUNT_BPS ?? 0);
const PUSH_PER_SOL = Number(import.meta.env.VITE_PUSH_PER_SOL ?? 100);

export default function Marketplace() {
  const [boards, setBoards] = useState([]);
  const [checkout, setCheckout] = useState({ board: null, payType: 'sol' });

  useEffect(() => {
    fetch('/api/boards')
      .then((res) => res.json())
      .then(setBoards);
  }, []);

  function openCheckout(board) {
    setCheckout({ board, payType: 'sol' });
  }

  async function startPayment() {
    const { board, payType } = checkout;
    if (!board) return alert('Pick a board first');
    if (!MERCHANT) return alert('Missing merchant wallet');

    const recipient = new PublicKey(MERCHANT);
    const priceSol = Number(board.priceSol ?? 0.25);

    let amount   = priceSol;
    let splToken = null;

    if (payType === 'push') {
      if (!PUSH_MINT) return alert('Missing PUSH mint');
      const pushMint   = new PublicKey(PUSH_MINT);
      const discounted = priceSol * (1 - DISCOUNT_BPS / 10_000);
      const amountPush = discounted * PUSH_PER_SOL;

      splToken = pushMint;
      amount   = amountPush;
    }

    const url = encodeURL({
      recipient,
      amount,
      splToken,
      label: board.name,
      message: payType === 'push' ? 'PUSH token purchase' : 'SOL purchase',
    });

    const qrContainer = document.getElementById('pay-qr');
    qrContainer.innerHTML = '';
    const qr = createQR(url, 256, 'white');
    qr.append(qrContainer);

    // Mint after generating QR (placeholder; integrate payment verification as needed)
    fetch('/api/mint-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardId: board.id,
        buyer: MERCHANT, // adjust to use buyer's address if available
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.mintAddress) {
          alert(`NFT minted! Mint address: ${data.mintAddress}`);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((b) => (
          <div key={b.id} className="border rounded p-4 shadow">
            <h2 className="text-xl font-semibold mb-2">{b.name}</h2>
            <p className="mb-2">{b.description}</p>
            <p className="font-bold mb-2">{b.priceSol} SOL</p>
            <button
              onClick={() => openCheckout(b)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      {checkout.board && (
        <div className="mt-4">
          <h2>Checkout: {checkout.board.name}</h2>
          <label>
            <input
              type="radio"
              name="payment"
              checked={checkout.payType === 'sol'}
              onChange={() => setCheckout({ ...checkout, payType: 'sol' })}
            />
            Pay with SOL ({(checkout.board.priceSol ?? 0.25).toFixed(3)} SOL)
          </label>
          <label className="ml-4">
            <input
              type="radio"
              name="payment"
              checked={checkout.payType === 'push'}
              onChange={() => setCheckout({ ...checkout, payType: 'push' })}
            />
            Pay with PUSH ({(100 - DISCOUNT_BPS / 100).toFixed(0)}% of SOL price)
          </label>
          <button
            onClick={startPayment}
            className="ml-4 bg-cyan-500 px-3 py-2 rounded"
          >
            Generate Payment
          </button>
          <div id="pay-qr" className="mt-3" />
          <p className="text-xs text-zinc-500">
            Scan with Phantom, Backpack, etc. Your board will mint automatically.
          </p>
        </div>
      )}
    </div>
  );
}
