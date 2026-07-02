import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Ripple from './Ripple'
import { formatINR } from '../utils/formatCurrency'
import { monthLabel } from '../utils/dateHelpers'

function uid() {
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

// Prompt shown on the 1st of each month (and until confirmed) to enter/confirm
// this month's in-hand salary and fixed expenses. Pre-filled from the previous month.
function sameSource(a, b) {
  return a && b && a.type === b.type && a.id === b.id
}

export default function FixedExpensesDialog({
  open,
  monthKey,
  template,
  salary,
  paymentSources = [],
  defaultSource,
  onConfirm,
  onClose,
  dismissable
}) {
  const [rows, setRows] = useState([])
  const [salaryInput, setSalaryInput] = useState('')

  const fallbackSource = defaultSource || paymentSources[0] || null

  useEffect(() => {
    if (open) {
      setRows(
        (template && template.length ? template : []).map((t) => ({
          id: t.id || uid(),
          label: t.label,
          amount: String(t.amount ?? ''),
          source: t.source || fallbackSource
        }))
      )
      setSalaryInput(salary != null ? String(salary) : '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template, salary])

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const surplus = (Number(salaryInput) || 0) - total

  const updateRow = (id, key, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)))

  const removeRow = (id) => setRows((prev) => prev.filter((r) => r.id !== id))

  const addRow = () =>
    setRows((prev) => [...prev, { id: uid(), label: '', amount: '', source: fallbackSource }])

  const cycleSource = (id) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const idx = paymentSources.findIndex((s) => sameSource(s, r.source))
        const next = paymentSources[(idx + 1) % Math.max(1, paymentSources.length)] || null
        return { ...r, source: next }
      })
    )

  const confirm = () => {
    onConfirm(
      rows.map((r) => ({
        id: r.id,
        label: r.label,
        amount: Number(r.amount) || 0,
        source: r.source || fallbackSource
      })),
      Number(salaryInput) || 0
    )
  }

  const sourceChip = (source) => {
    if (!source) return '—'
    const s = paymentSources.find((x) => sameSource(x, source))
    const label = s?.label || (source.type === 'card' ? 'Card' : 'Bank')
    return `${source.type === 'card' ? '💳' : '🏦'} ${label}`
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[75] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissable ? onClose : undefined}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[76] max-h-[92vh] overflow-hidden rounded-t-3xl bg-surface ring-1 ring-white/10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            <div className="px-5 pb-2 pt-3">
              <h2 className="text-lg font-bold text-white">Monthly setup · {monthLabel(monthKey)}</h2>
              <p className="text-sm text-muted">
                How much did you get in-hand, and what are your fixed outflows this month?
              </p>
            </div>

            <div className="no-scrollbar max-h-[52vh] overflow-y-auto px-5">
              {/* In-hand salary */}
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                In-hand this month
              </label>
              <div className="mb-4 flex items-center rounded-xl bg-surface-2 px-3 ring-1 ring-white/5 focus-within:ring-primary/50">
                <span className="text-lg font-bold text-muted">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={salaryInput}
                  placeholder="0"
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="w-full bg-transparent px-2 py-3 text-lg font-bold text-white outline-none"
                />
              </div>

              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
                Fixed expenses
              </label>
              <div className="space-y-3">
                {rows.map((r) => (
                  <div key={r.id} className="rounded-xl bg-surface-2/40 p-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={r.label}
                        placeholder="Name"
                        onChange={(e) => updateRow(r.id, 'label', e.target.value)}
                        className="min-w-0 flex-1 rounded-lg bg-surface-2 px-3 py-2.5 text-sm text-white outline-none ring-1 ring-white/5 placeholder:text-muted focus:ring-primary/50"
                      />
                      <div className="flex w-28 items-center rounded-lg bg-surface-2 px-2 ring-1 ring-white/5">
                        <span className="text-xs text-muted">₹</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={r.amount}
                          placeholder="0"
                          onChange={(e) => updateRow(r.id, 'amount', e.target.value)}
                          className="w-full bg-transparent px-1 py-2.5 text-right text-sm text-white outline-none"
                        />
                      </div>
                      <button
                        onClick={() => removeRow(r.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-error active:bg-white/5"
                        aria-label="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    {paymentSources.length > 0 && (
                      <button
                        onClick={() => cycleSource(r.id)}
                        className="mt-1.5 rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-primary ring-1 ring-white/5 active:scale-95"
                      >
                        {sourceChip(r.source)} · tap to change
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addRow}
                className="mt-3 w-full rounded-xl border border-dashed border-white/15 py-2.5 text-sm font-semibold text-muted active:bg-white/5"
              >
                + Add fixed expense
              </button>
            </div>

            <div className="border-t border-white/5 px-5 py-4 safe-bottom">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-muted">Total fixed</span>
                <span className="text-sm font-bold text-warning">{formatINR(total)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted">Surplus after fixed</span>
                <span
                  className={`text-lg font-extrabold ${surplus >= 0 ? 'text-success' : 'text-error'}`}
                >
                  {formatINR(surplus)}
                </span>
              </div>
              <div className="flex gap-2">
                {dismissable && (
                  <button
                    onClick={onClose}
                    className="rounded-xl px-4 py-3.5 text-sm font-semibold text-muted active:bg-white/5"
                  >
                    Cancel
                  </button>
                )}
                <Ripple
                  onClick={confirm}
                  className="flex-1 rounded-xl bg-primary py-3.5 text-center text-base font-bold text-white"
                >
                  Confirm for {monthLabel(monthKey).split(' ')[0]}
                </Ripple>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
