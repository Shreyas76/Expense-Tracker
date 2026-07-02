import { AnimatePresence, motion } from 'framer-motion'
import { formatINR } from '../utils/formatCurrency'
import { monthLabel } from '../utils/dateHelpers'

export default function MonthRolloverDialog({ open, summary, onClose }) {
  if (!summary) return null
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-x-6 top-1/2 z-[71] mx-auto max-w-sm -translate-y-1/2 overflow-hidden rounded-3xl bg-surface ring-1 ring-white/10"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="bg-gradient-to-br from-primary/30 to-primary/5 px-5 pb-4 pt-6 text-center">
              <div className="text-4xl">🎉</div>
              <h2 className="mt-2 text-xl font-extrabold text-white">New Month!</h2>
              <p className="text-sm text-muted">Here’s how {monthLabel(summary.month)} went</p>
            </div>
            <div className="space-y-3 px-5 py-5">
              <Row label="Total spent" value={formatINR(summary.spent)} color="#ef4444" />
              <Row label="Total invested" value={formatINR(summary.invested)} color="#6366f1" />
              <Row label="Fixed outflow" value={formatINR(summary.fixed)} color="#f59e0b" />
              <div className="rounded-2xl bg-surface-2 p-4 text-center">
                <p className="text-xs text-muted">Savings rate</p>
                <p className="text-3xl font-extrabold text-success">
                  {Math.max(0, summary.savingsRate)}%
                </p>
              </div>
              <p className="text-center text-xs text-muted">
                Monthly counters are reset. Cumulative goals carried forward. Time to SIP! 📈
              </p>
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-white active:opacity-90"
              >
                Start the month
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function Row({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
