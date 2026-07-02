import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export const BALANCE_PIN = '1687'

// Reusable 4-digit PIN modal. Calls onSuccess() when the correct PIN is entered.
export default function PinPrompt({
  open,
  onClose,
  onSuccess,
  message = 'to view your bank balances'
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) {
      setPin('')
      setError(false)
    }
  }, [open])

  const onChange = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 4)
    setPin(digits)
    setError(false)
    if (digits.length === 4) {
      if (digits === BALANCE_PIN) {
        onSuccess()
        onClose()
      } else {
        setError(true)
        setPin('')
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-6 top-1/2 z-[71] mx-auto max-w-xs -translate-y-1/2 rounded-2xl bg-surface p-5 text-center ring-1 ring-white/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-base font-bold text-white">Enter PIN</h3>
            <p className="mb-4 text-xs text-muted">{message}</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full rounded-xl bg-surface-2 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white outline-none ring-1 ${
                error ? 'ring-error' : 'ring-white/10 focus:ring-primary/50'
              }`}
              placeholder="••••"
            />
            {error && <p className="mt-2 text-xs text-error">Wrong PIN, try again</p>}
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-muted active:bg-white/5"
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
