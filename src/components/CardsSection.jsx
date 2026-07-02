import { motion } from 'framer-motion'
import ProgressBar from './ProgressBar'
import Ripple from './Ripple'
import { formatINR, formatCompactINR } from '../utils/formatCurrency'

function utilColor(pct) {
  if (pct >= 80) return '#ef4444'
  if (pct >= 50) return '#f59e0b'
  return '#10b981'
}

// Home section: per-card outstanding, shared-limit availability and utilization.
export default function CardsSection({ cardProgress, totalOutstanding, onPayBill }) {
  if (!cardProgress || cardProgress.length === 0) return null

  return (
    <div className="mb-4 rounded-3xl bg-surface p-4 ring-1 ring-white/5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white">Credit cards</h2>
          <p className="text-xs text-muted">
            Total due <span className="font-semibold text-warning">{formatINR(totalOutstanding)}</span>
          </p>
        </div>
        <Ripple
          onClick={() => onPayBill()}
          className="rounded-full bg-primary/15 px-3.5 py-2 text-xs font-semibold text-primary active:scale-95"
        >
          Pay bill
        </Ripple>
      </div>
      <p className="mb-3 text-[11px] text-muted">
        Paying a bill is not counted as a new expense — it only moves money from your bank to the card.
      </p>

      <div className="space-y-3">
        {cardProgress.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-2xl bg-surface-2 p-3"
          >
            <div className="mb-1.5 flex items-start justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">💳 {c.name}</p>
                <p className="text-[11px] text-muted">
                  {c.shared ? `${c.groupLabel} · shared limit` : c.groupLabel}
                </p>
              </div>
              <button
                onClick={() => onPayBill(c.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary active:bg-white/5"
              >
                Pay
              </button>
            </div>

            <div className="mb-1 flex items-end justify-between">
              <span className="text-xs text-muted">Outstanding</span>
              <span className="text-base font-bold text-warning">{formatINR(c.spent)}</span>
            </div>

            <ProgressBar pct={c.utilization} color={utilColor(c.utilization)} height={6} />
            <div className="mt-1 flex justify-between text-[11px] text-muted">
              <span>
                {c.shared ? 'Group used ' : 'Used '}
                {formatCompactINR(c.spentInGroup)} / {formatCompactINR(c.limit)}
              </span>
              <span>{formatCompactINR(c.available)} free</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
