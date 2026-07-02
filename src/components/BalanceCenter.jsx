import { useState } from 'react'
import { formatINR } from '../utils/formatCurrency'
import PinPrompt from './PinPrompt'

// Rendered inside the donut hole. Shows total bank balance masked until the PIN
// is entered; revealing shows the total plus each account. In-memory only.
export default function BalanceCenter({ banks, total }) {
  const [revealed, setRevealed] = useState(false)
  const [asking, setAsking] = useState(false)

  return (
    <>
      {revealed ? (
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Balance
          </span>
          <span className="text-xl font-extrabold leading-tight text-white">
            {formatINR(total)}
          </span>
          <div className="mt-1 w-[120px] space-y-0.5">
            {banks.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <span className="text-[10px] text-muted">{b.label}</span>
                <span className="text-[10px] font-semibold text-gray-200">
                  {formatINR(b.balance)}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setRevealed(false)}
            className="mt-1 text-[10px] font-semibold text-muted active:text-white"
          >
            Hide
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAsking(true)}
          className="flex flex-col items-center active:scale-95"
        >
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted">
            Balance
          </span>
          <span className="text-2xl font-extrabold leading-tight text-white">₹ ••••</span>
          <span className="mt-0.5 text-[10px] font-semibold text-primary">🔒 Tap to view</span>
        </button>
      )}

      <PinPrompt open={asking} onClose={() => setAsking(false)} onSuccess={() => setRevealed(true)} />
    </>
  )
}
