// src/pages/Marketplace.jsx
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { encodeURL, createQR } from '@solana/pay';

export default function Marketplace() {
  const [boards, setBoards] = useState([]);

  useEffect(() => {
    fetch('/api/boards').then(res => res.json()).then(setBoards);
  }, []);

  const merchant = import.meta.env.VITE_MERCHANT_WALLET || 'wallett.sol';

  function generateReference() {
    // Create a unique reference per order (for example, a random public key).
    return PublicKey.unique();
  }

  function buyBoard(board) {
    const recipient = new PublicKey(merchant);
    const amount = board.priceSol;
    const reference = generateReference();

    const url = encodeURL({
      recipient,
      amount,
      reference,
      label: board.name,
      message: 'PUSH board purchase',
    });

    const qrContainer = document.getElementById(`qr-${board.id}`);
    qrContainer.innerHTML = '';
    const qr = createQR(url, 256, 'white');
    qr.append(qrContainer);
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Marketplace</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map(board => (
          <div key={board.id} className="border rounded p-4 shadow">
            <h2 className="text-xl font-semibold mb-2">{board.name}</h2>
            <p className="mb-2">{board.description}</p>
            <p className="font-bold mb-2">{board.priceSol} SOL</p>
            <button
              onClick={() => buyBoard(board)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Buy with Solana Pay
            </button>
            <div id={`qr-${board.id}`} className="mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
