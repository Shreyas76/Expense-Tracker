import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from './BottomSheet'
import Ripple from './Ripple'
import { formatINR } from '../utils/formatCurrency'

// Pay a credit-card bill from a bank: reduces the bank balance and the card's outstanding.
export default function PayBillSheet({ open, onClose, cards, banks, presetCardId, onSubmit }) {
  const [cardId, setCardId] = useState(presetCardId || cards[0]?.id)
  const [bankId, setBankId] = useState(banks[0]?.id)
  const [amount, setAmount] = useState('')

  const card = cards.find((c) => c.id === cardId)

  useEffect(() => {
    if (open) {
      const initialCard = presetCardId || cards[0]?.id
      setCardId(initialCard)
      setBankId(banks[0]?.id)
      const c = cards.find((x) => x.id === initialCard)
      setAmount(c && c.spent > 0 ? String(c.spent) : '')
    }
  }, [open, presetCardId, cards, banks])

  const submit = () => {
    const amt = Number(amount)
    if (!cardId || !bankId || !amt || amt <= 0) return
    onSubmit({ cardId, bankId, amount: amt })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Pay card bill">
      <p className="mb-1 text-sm text-muted">
        Clear what you already owe on a card. This is <span className="font-semibold text-white">not</span> a
        new expense — those were logged when you spent on the card.
      </p>
      <p className="mb-3 text-xs text-muted">
        Money moves from your bank to the card. Your bank balance goes down; card outstanding goes down.
      </p>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Card</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCardId(c.id)
              setAmount(c.spent > 0 ? String(c.spent) : '')
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              cardId === c.id ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
            }`}
          >
            💳 {c.name}
          </button>
        ))}
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Pay from bank</p>
      <p className="mb-2 text-[11px] text-muted">Choose which account the payment leaves.</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {banks.map((b) => (
          <button
            key={b.id}
            onClick={() => setBankId(b.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              bankId === b.id ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
            }`}
          >
            🏦 {b.label}
          </button>
        ))}
      </div>

      {card && (
        <p className="mb-2 text-xs text-muted">
          Outstanding on {card.name}: <span className="text-warning">{formatINR(card.spent)}</span>
        </p>
      )}

      <div className="flex items-center justify-center py-2">
        <span className="text-3xl font-bold text-muted">₹</span>
        <input
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full max-w-[220px] bg-transparent text-center text-4xl font-extrabold text-white outline-none placeholder:text-white/20"
        />
      </div>

      <Ripple
        onClick={submit}
        disabled={!Number(amount) || !cardId || !bankId}
        className="mt-4 w-full rounded-xl bg-primary py-3.5 text-center text-base font-bold text-white disabled:opacity-40"
      >
        Pay {Number(amount) ? formatINR(Number(amount)) : 'bill'} 💸
      </Ripple>
    </BottomSheet>
  )
}
