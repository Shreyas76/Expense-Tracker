import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import BottomSheet from './BottomSheet'
import Ripple from './Ripple'
import ProgressBar from './ProgressBar'
import { formatINR } from '../utils/formatCurrency'

function sameSource(a, b) {
  return a && b && a.type === b.type && a.id === b.id
}

export default function InvestSheet({
  open,
  onClose,
  buckets,
  onSubmit,
  editEntry,
  paymentSources = [],
  defaultSource
}) {
  const isEdit = !!editEntry
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [source, setSource] = useState(null)
  const amountRef = useRef(null)

  // Investments usually come out of a bank; default to the first bank if available.
  const banks = paymentSources.filter((s) => s.type === 'bank')
  const cards = paymentSources.filter((s) => s.type === 'card')
  const preferredSource = banks[0] || defaultSource || paymentSources[0] || null

  useEffect(() => {
    if (open) {
      if (editEntry) {
        const bucket = buckets.find((b) => b.id === editEntry.bucketId)
        const b = bucket || { id: editEntry.bucketId, name: editEntry.bucketName, fund: '', target: 0, invested: 0, remaining: 0, pct: 0, icon: '📈' }
        setSelected(b)
        setAmount(String(editEntry.amount ?? ''))
        setNote(editEntry.note || '')
        setSource(b.keepInAccount ? null : editEntry.source || preferredSource)
      } else {
        setSelected(null)
        setAmount('')
        setNote('')
        setSource(preferredSource)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editEntry, buckets])

  // Some buckets (e.g. Marriage Savings) stay in the bank — no account deduction.
  const needsSource = selected && !selected.keepInAccount

  useEffect(() => {
    if (selected) {
      const t = setTimeout(() => amountRef.current?.focus(), 250)
      return () => clearTimeout(t)
    }
  }, [selected])

  const pick = (b) => {
    setSelected(b)
    setSource(b.keepInAccount ? null : preferredSource)
    // Prefill with remaining amount to hit the monthly target.
    setAmount(b.remaining > 0 ? String(b.remaining) : '')
  }

  const submit = () => {
    const num = Number(amount)
    if (!selected || !num || num <= 0) return
    if (!selected.keepInAccount && !source) return
    const willExceed = selected.invested + num > selected.target
    onSubmit({
      bucketId: selected.id,
      amount: num,
      note: note.trim(),
      exceeded: willExceed,
      source: selected.keepInAccount ? null : source
    })
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={isEdit ? 'Edit Investment' : 'Log Investment'}>
      {!selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5">
          <p className="mb-1 text-sm text-muted">Choose a bucket</p>
          {buckets.map((b) => (
            <Ripple
              key={b.id}
              onClick={() => pick(b)}
              className="w-full rounded-2xl bg-surface-2 p-3.5 text-left active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{b.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-white">{b.name}</p>
                    {b.status === 'done' && <span className="text-success">✅</span>}
                  </div>
                  <p className="truncate text-xs text-muted">{b.fund}</p>
                  <div className="mt-2">
                    <ProgressBar pct={b.pct} height={6} color={b.status === 'done' ? '#10b981' : '#6366f1'} />
                  </div>
                  <div className="mt-1 flex justify-between text-[11px] text-muted">
                    <span>{formatINR(b.invested)} / {formatINR(b.target)}</span>
                    <span>{b.remaining > 0 ? `${formatINR(b.remaining)} left` : 'Target met'}</span>
                  </div>
                </div>
              </div>
            </Ripple>
          ))}
        </motion.div>
      )}

      {selected && (
        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="pt-2">
          <button
            onClick={() => setSelected(null)}
            className="mb-3 flex items-center gap-2 text-sm text-muted active:text-white"
          >
            ← <span>{selected.icon} {selected.name}</span>
          </button>

          <div className="mb-3 rounded-xl bg-surface-2 p-3 text-xs text-muted">
            Target {formatINR(selected.target)} · Invested {formatINR(selected.invested)} ·{' '}
            <span className={selected.remaining > 0 ? 'text-warning' : 'text-success'}>
              {selected.remaining > 0 ? `${formatINR(selected.remaining)} to go` : 'Target met 🎉'}
            </span>
          </div>

          <div className="flex items-center justify-center py-3">
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

          {Number(amount) > 0 && selected.invested + Number(amount) > selected.target && (
            <p className="mb-3 text-center text-sm font-semibold text-success">Above target! 🎉</p>
          )}

          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={80}
            className="mb-4 w-full rounded-xl bg-surface-2 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/5 placeholder:text-muted focus:ring-primary/50"
          />

          {/* Source of funds (skipped for buckets that stay in the account) */}
          {needsSource ? (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Paid from
              </p>
              {banks.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
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
              )}
              {cards.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
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
              )}
            </>
          ) : (
            <div className="mb-4 rounded-xl bg-surface-2 px-4 py-3 text-xs text-muted">
              💡 Stays in your account — no balance will be deducted.
            </div>
          )}

          <Ripple
            onClick={submit}
            disabled={!Number(amount) || (needsSource && !source)}
            className="w-full rounded-xl bg-primary py-4 text-center text-base font-bold text-white disabled:opacity-40"
          >
            {isEdit ? 'Save' : 'Invest'} {Number(amount) ? formatINR(Number(amount)) : ''} {isEdit ? '💾' : '📈'}
          </Ripple>
        </motion.div>
      )}
    </BottomSheet>
  )
}
