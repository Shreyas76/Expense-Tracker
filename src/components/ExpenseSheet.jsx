import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from './BottomSheet'
import Ripple from './Ripple'
import { CATEGORIES, getCategory } from '../constants/categories'
import { formatINR } from '../utils/formatCurrency'

function sameSource(a, b) {
  return a && b && a.type === b.type && a.id === b.id
}

export default function ExpenseSheet({
  open,
  onClose,
  onSubmit,
  editEntry,
  paymentSources = [],
  defaultSource
}) {
  const isEdit = !!editEntry
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [source, setSource] = useState(defaultSource || null)
  const amountRef = useRef(null)

  // Reset (or prefill for edit) whenever the sheet opens.
  useEffect(() => {
    if (open) {
      if (editEntry) {
        const cat = getCategory(editEntry.category)
        setCategory(cat)
        setAmount(String(editEntry.amount ?? ''))
        setNote(editEntry.note || '')
        setSource(editEntry.source || defaultSource || null)
        setStep(2)
      } else {
        setStep(1)
        setCategory(null)
        setAmount('')
        setNote('')
        setSource(defaultSource || null)
      }
    }
  }, [open, editEntry, defaultSource])

  // Auto-focus the numeric field on step 2.
  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => amountRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [step])

  const selectCategory = (cat) => {
    setCategory(cat)
    setStep(2)
  }

  const submit = () => {
    const num = Number(amount)
    if (!category || !num || num <= 0 || !source) return
    onSubmit({ category: category.id, amount: num, note: note.trim(), source })
    onClose()
  }

  const banks = paymentSources.filter((s) => s.type === 'bank')
  const cards = paymentSources.filter((s) => s.type === 'card')

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Expense' : 'Log Expense'}>
      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="mb-3 text-sm text-muted">Select a category</p>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Ripple
                key={cat.id}
                onClick={() => selectCategory(cat)}
                className="flex min-h-[80px] flex-col items-center justify-center gap-1 rounded-2xl bg-surface-2 py-3 active:scale-95"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-[11px] font-medium text-gray-300">{cat.label}</span>
              </Ripple>
            ))}
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          className="pt-2"
        >
          <button
            onClick={() => setStep(1)}
            className="mb-3 flex items-center gap-2 text-sm text-muted active:text-white"
          >
            ← <span>{category?.emoji} {category?.label}</span>
          </button>

          <div className="flex items-center justify-center py-4">
            <span className="text-3xl font-bold text-muted">₹</span>
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full max-w-[220px] bg-transparent text-center text-5xl font-extrabold text-white outline-none placeholder:text-white/20"
            />
          </div>

          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
            className="mb-4 w-full rounded-xl bg-surface-2 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/5 placeholder:text-muted focus:ring-primary/50"
          />

          {/* Mode of payment */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Paid with
          </p>
          {cards.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-[11px] text-muted">Credit cards</p>
              <div className="flex flex-wrap gap-2">
                {cards.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSource(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      sameSource(source, s) ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    💳 {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {banks.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 text-[11px] text-muted">Bank / UPI</p>
              <div className="flex flex-wrap gap-2">
                {banks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSource(s)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      sameSource(source, s) ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
                    }`}
                  >
                    🏦 {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Ripple
            onClick={submit}
            disabled={!Number(amount) || !source}
            className="w-full rounded-xl bg-primary py-4 text-center text-base font-bold text-white disabled:opacity-40"
          >
            {isEdit ? 'Save' : 'Log'} {Number(amount) ? formatINR(Number(amount)) : 'Expense'} {isEdit ? '💾' : '✅'}
          </Ripple>
        </motion.div>
      )}
    </BottomSheet>
  )
}
