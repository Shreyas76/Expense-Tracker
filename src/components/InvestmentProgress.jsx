import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ProgressBar from './ProgressBar'
import { formatINR } from '../utils/formatCurrency'
import { estimateCompletionMonth, formatTimestamp } from '../utils/dateHelpers'

const STATUS = {
  done: { label: 'Done', color: '#10b981', bg: 'bg-success/15 text-success' },
  ontrack: { label: 'On Track', color: '#6366f1', bg: 'bg-primary/15 text-primary' },
  behind: { label: 'Behind', color: '#f59e0b', bg: 'bg-warning/15 text-warning' }
}

export default function InvestmentProgress({ model, onEditInvestment, onDeleteInvestment }) {
  const {
    bucketProgress,
    goalProgress,
    allocations,
    investedThisMonth,
    phase,
    monthInvestments
  } = model

  const monthlyTargetTotal = bucketProgress.reduce((s, b) => s + b.target, 0)

  // Monthly pace per goal = current phase contribution to that goal.
  const paceByGoal = useMemo(() => {
    const map = {}
    allocations.forEach((a) => {
      if (a.goalId) map[a.goalId] = (map[a.goalId] || 0) + a.target
    })
    return map
  }, [allocations])

  return (
    <div className="px-4 pb-28 pt-2">
      <h1 className="mb-1 text-2xl font-extrabold text-white">Investments</h1>
      <p className="mb-4 text-sm text-muted">
        Phase {phase} · {formatINR(investedThisMonth)} of {formatINR(monthlyTargetTotal)} this month
      </p>

      {/* Monthly targets */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          Monthly Targets
        </h2>
        <div className="space-y-3">
          {bucketProgress.map((b, i) => {
            const st = STATUS[b.status]
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-2xl bg-surface p-4 ring-1 ring-white/5"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{b.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{b.name}</p>
                      <p className="text-[11px] text-muted">{b.fund}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.bg}`}>
                    {st.label}
                  </span>
                </div>
                <ProgressBar pct={b.pct} color={st.color} />
                <div className="mt-1.5 flex justify-between text-xs text-muted">
                  <span>
                    {formatINR(b.invested)} / {formatINR(b.target)}
                  </span>
                  <span>{Math.round(b.pct)}%</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* This month's contributions (editable) */}
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          This Month’s Contributions
        </h2>
        {monthInvestments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-surface py-8 text-center ring-1 ring-white/5">
            <span className="text-4xl">📈</span>
            <p className="mt-2 text-sm text-muted">No investments logged yet</p>
            <p className="text-xs text-muted">Use the Invest button to add one</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {monthInvestments.map((inv) => (
                <motion.div
                  key={inv.id}
                  layout
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 ring-1 ring-white/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-lg">
                    📈
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {inv.bucketName}
                      {inv.note ? <span className="text-muted"> · {inv.note}</span> : ''}
                    </p>
                    <p className="text-xs text-muted">{formatTimestamp(inv.ts)}</p>
                  </div>
                  <span className="text-sm font-semibold text-primary">+{formatINR(inv.amount)}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => onEditInvestment(inv)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-sm active:scale-90"
                      aria-label="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onDeleteInvestment(inv)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-sm active:scale-90"
                      aria-label="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Cumulative goals */}
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
          Cumulative Goals
        </h2>
        <div className="space-y-3">
          {goalProgress.map((g, i) => {
            const pace = paceByGoal[g.id] || 0
            const eta = estimateCompletionMonth(g.current, pace, g.target)
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-surface p-4 ring-1 ring-white/5"
              >
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{g.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{g.name}</p>
                      <p className="text-[11px] text-muted">{g.note}</p>
                    </div>
                  </div>
                  <span className="text-lg font-extrabold" style={{ color: g.color }}>
                    {Math.round(g.pct)}%
                  </span>
                </div>
                <ProgressBar pct={g.pct} color={g.color} height={12} />
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-muted">
                    {formatINR(g.current)} / {formatINR(g.target)}
                  </span>
                  <span className="text-muted">
                    {g.remaining > 0 ? `ETA ${eta}` : 'Goal reached 🎉'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
