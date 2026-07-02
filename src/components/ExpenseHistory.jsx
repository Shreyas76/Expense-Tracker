import { useMemo, useState } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts'
import { getCategory, CATEGORIES } from '../constants/categories'
import { formatINR, formatCompactINR } from '../utils/formatCurrency'
import { formatTimestamp, monthLabel, shortMonthLabel, prevMonthKey } from '../utils/dateHelpers'

function SwipeRow({ tx, onDelete, onEdit, sourceLabel }) {
  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [-120, -40, 0], [1, 0.6, 0])
  const cat = getCategory(tx.category)
  const src = sourceLabel ? sourceLabel(tx.source) : ''

  return (
    <div className="relative overflow-hidden">
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-end rounded-xl bg-error/90 pr-5 text-sm font-semibold text-white"
      >
        Delete 🗑️
      </motion.div>
      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -140, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(_, info) => {
          if (info.offset.x < -100) onDelete(tx)
        }}
        className="relative flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-lg">
          {cat.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            {cat.label}
            {tx.note ? <span className="text-muted"> · {tx.note}</span> : ''}
          </p>
          <p className="text-xs text-muted">
            {formatTimestamp(tx.ts)}
            {src && src !== '—' ? ` · ${src}` : ''}
          </p>
        </div>
        <span className="text-sm font-semibold text-error">−{formatINR(tx.amount)}</span>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onEdit(tx)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-sm active:scale-90"
            aria-label="Edit"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(tx)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-sm active:scale-90"
            aria-label="Delete"
          >
            🗑️
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function ExpenseHistory({ data, monthKey, onDelete, onEdit, sourceLabel }) {
  const [catFilter, setCatFilter] = useState('all')
  const [monthFilter, setMonthFilter] = useState(monthKey)

  const availableMonths = useMemo(() => {
    const keys = Object.keys(data?.months || {}).filter(
      (k) => (data.months[k].expenses || []).length > 0 || k === monthKey
    )
    if (!keys.includes(monthKey)) keys.push(monthKey)
    return keys.sort().reverse()
  }, [data, monthKey])

  const monthExpenses = useMemo(() => {
    const m = data?.months?.[monthFilter]
    return [...((m && m.expenses) || [])].sort((a, b) => b.ts - a.ts)
  }, [data, monthFilter])

  const filtered = useMemo(
    () => (catFilter === 'all' ? monthExpenses : monthExpenses.filter((e) => e.category === catFilter)),
    [monthExpenses, catFilter]
  )

  const breakdown = useMemo(() => {
    const byCat = {}
    monthExpenses.forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0)
    })
    return Object.entries(byCat)
      .map(([id, value]) => ({ id, value, ...getCategory(id) }))
      .sort((a, b) => b.value - a.value)
  }, [monthExpenses])

  const thisTotal = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const prevKey = prevMonthKey(monthFilter)
  const prevTotal = (data?.months?.[prevKey]?.expenses || []).reduce(
    (s, e) => s + Number(e.amount || 0),
    0
  )
  const diff = thisTotal - prevTotal

  return (
    <div className="px-4 pb-28 pt-2">
      <h1 className="mb-3 text-2xl font-extrabold text-white">Expenses</h1>

      {/* Month selector */}
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {availableMonths.map((k) => (
          <button
            key={k}
            onClick={() => setMonthFilter(k)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              monthFilter === k ? 'bg-primary text-white' : 'bg-surface text-muted'
            }`}
          >
            {shortMonthLabel(k)}
          </button>
        ))}
      </div>

      {/* Comparison */}
      <div className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted">{monthLabel(monthFilter)}</p>
            <p className="text-2xl font-extrabold text-white">{formatINR(thisTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted">vs {shortMonthLabel(prevKey)}</p>
            <p
              className={`text-sm font-semibold ${
                diff > 0 ? 'text-error' : diff < 0 ? 'text-success' : 'text-muted'
              }`}
            >
              {diff === 0 ? '—' : `${diff > 0 ? '▲' : '▼'} ${formatINR(Math.abs(diff))}`}
            </p>
          </div>
        </div>
        {prevTotal > 0 && (
          <p className="mt-1 text-xs text-muted">
            Last month you spent {formatINR(prevTotal)}, this month {formatINR(thisTotal)}
          </p>
        )}
      </div>

      {/* Category chart */}
      {breakdown.length > 0 && (
        <div className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <h2 className="mb-2 text-sm font-bold text-white">By category</h2>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis
                  dataKey="emoji"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 16 }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    background: '#232733',
                    border: 'none',
                    borderRadius: 12,
                    color: '#fff'
                  }}
                  formatter={(v) => [formatINR(v), 'Spent']}
                  labelFormatter={(l, p) => p?.[0]?.payload?.label || ''}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {breakdown.map((b) => (
                    <Cell key={b.id} fill={b.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category filter chips */}
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setCatFilter('all')}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
            catFilter === 'all' ? 'bg-primary text-white' : 'bg-surface text-muted'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCatFilter(c.id)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              catFilter === c.id ? 'bg-primary text-white' : 'bg-surface text-muted'
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl">🗂️</span>
          <p className="mt-3 text-sm text-muted">No expenses to show</p>
          <p className="text-xs text-muted">Try a different month or category</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="px-1 text-xs text-muted">Swipe left, or use the buttons, to edit/delete</p>
          <AnimatePresence initial={false}>
            {filtered.map((tx) => (
              <motion.div
                key={tx.id}
                layout
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              >
                <SwipeRow
                  tx={tx}
                  onDelete={(t) => onDelete(monthFilter, t)}
                  onEdit={(t) => onEdit(monthFilter, t)}
                  sourceLabel={sourceLabel}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
