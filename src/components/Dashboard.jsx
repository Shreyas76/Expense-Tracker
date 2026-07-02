import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import DonutChart from './DonutChart'
import Ripple from './Ripple'
import BottomSheet from './BottomSheet'
import BalanceCenter from './BalanceCenter'
import CardsSection from './CardsSection'
import { formatINR, formatCompactINR } from '../utils/formatCurrency'
import { greetingForNow, monthLabel, todayLabel, formatTimestamp } from '../utils/dateHelpers'
import { getCategory } from '../constants/categories'

function SummaryCard({ label, value, color, accent, onClick, editable }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`w-full rounded-2xl bg-surface p-3.5 text-left ring-1 ring-white/5 ${
        onClick ? 'active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-xs font-medium text-muted">{label}</span>
        {editable && <span className="ml-auto text-xs text-muted">✏️</span>}
      </div>
      <p className="mt-1.5 text-lg font-bold" style={{ color: color || '#fff' }}>
        {formatINR(value)}
      </p>
    </Tag>
  )
}

function TransactionRow({ tx, sourceLabel, banks, cards }) {
  if (tx.kind === 'investment') {
    return (
      <div className="flex items-center gap-3 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-lg">
          📈
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{tx.bucketName}</p>
          <p className="text-xs text-muted">
            {formatTimestamp(tx.ts)}
            {sourceLabel && tx.source && sourceLabel(tx.source) !== '—'
              ? ` · ${sourceLabel(tx.source)}`
              : ''}
          </p>
        </div>
        <span className="text-sm font-semibold text-primary">+{formatINR(tx.amount)}</span>
      </div>
    )
  }
  if (tx.kind === 'payment') {
    const bank = banks?.find((b) => b.id === tx.bankId)?.label
    const card = cards?.find((c) => c.id === tx.cardId)?.name
    return (
      <div className="flex items-center gap-3 py-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-lg">
          💸
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            Card bill paid{card ? ` · ${card}` : ''}
          </p>
          <p className="text-xs text-muted">
            {formatTimestamp(tx.ts)}
            {bank ? ` · from ${bank}` : ''}
            {' · not an expense'}
          </p>
        </div>
        <span className="text-sm font-semibold text-success">{formatINR(tx.amount)}</span>
      </div>
    )
  }
  const cat = getCategory(tx.category)
  const src = sourceLabel ? sourceLabel(tx.source) : ''
  return (
    <div className="flex items-center gap-3 py-2.5">
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
    </div>
  )
}

export default function Dashboard({
  model,
  monthKey,
  onLogExpense,
  onLogInvest,
  onSetSalary,
  onPayBill
}) {
  const {
    salary,
    fixedTotal,
    investedThisMonth,
    spentThisMonth,
    recentTransactions,
    phase,
    banks,
    totalBank,
    cards,
    cardProgress,
    totalOutstanding,
    sourceLabel
  } = model

  const [salaryOpen, setSalaryOpen] = useState(false)
  const [salaryInput, setSalaryInput] = useState(String(salary))

  useEffect(() => {
    if (salaryOpen) setSalaryInput(String(salary))
  }, [salaryOpen, salary])

  const saveSalary = () => {
    onSetSalary(Number(salaryInput) || 0)
    setSalaryOpen(false)
  }

  const donutData = [
    { name: 'Fixed', value: fixedTotal, color: '#f59e0b' },
    { name: 'Invested', value: investedThisMonth, color: '#6366f1' },
    { name: 'Spent', value: spentThisMonth, color: '#ef4444' }
  ]

  const recent = recentTransactions.slice(0, 5)

  return (
    <div className="px-4 pb-28 pt-2">
      <header className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{greetingForNow()}, {todayLabel()}</p>
          <h1 className="text-2xl font-extrabold text-white">Hey Shreyas 👋</h1>
          <p className="text-sm font-medium text-primary">{monthLabel(monthKey)} · Phase {phase}</p>
        </div>
        <Ripple
          onClick={onLogInvest}
          className="rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary active:scale-95"
        >
          Invest
        </Ripple>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-3xl bg-surface p-4 ring-1 ring-white/5"
      >
        <DonutChart
          data={donutData}
          centerContent={<BalanceCenter banks={banks} total={totalBank} />}
        />
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
          {donutData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-muted">
                {d.name} {formatCompactINR(d.value)}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <SummaryCard
          label="In-Hand"
          value={salary}
          accent="#8b90a0"
          editable
          onClick={() => setSalaryOpen(true)}
        />
        <SummaryCard label="Fixed Expenses" value={fixedTotal} accent="#f59e0b" color="#f59e0b" />
        <SummaryCard label="Invested" value={investedThisMonth} accent="#6366f1" color="#6366f1" />
        <SummaryCard label="Spent" value={spentThisMonth} accent="#ef4444" color="#ef4444" />
      </div>

      <CardsSection
        cardProgress={cardProgress}
        totalOutstanding={totalOutstanding}
        onPayBill={onPayBill}
      />

      <div className="rounded-3xl bg-surface p-4 ring-1 ring-white/5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Recent activity</h2>
          <span className="text-xs text-muted">Last 5</span>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl">🧾</span>
            <p className="mt-2 text-sm text-muted">No transactions yet this month</p>
            <p className="text-xs text-muted">Tap + to log your first expense</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                sourceLabel={sourceLabel}
                banks={banks}
                cards={cards}
              />
            ))}
          </div>
        )}
      </div>

      <BottomSheet open={salaryOpen} onClose={() => setSalaryOpen(false)} title="In-hand this month">
        <p className="mb-3 text-sm text-muted">
          Update how much you received this month. Fixed, spent and remaining adjust automatically —
          investment targets stay the same.
        </p>
        <div className="flex items-center justify-center py-2">
          <span className="text-3xl font-bold text-muted">₹</span>
          <input
            type="number"
            inputMode="numeric"
            autoFocus
            value={salaryInput}
            onChange={(e) => setSalaryInput(e.target.value)}
            className="w-full max-w-[240px] bg-transparent text-center text-4xl font-extrabold text-white outline-none placeholder:text-white/20"
          />
        </div>
        <Ripple
          onClick={saveSalary}
          className="mt-4 w-full rounded-xl bg-primary py-3.5 text-center text-base font-bold text-white"
        >
          Save in-hand 💾
        </Ripple>
      </BottomSheet>
    </div>
  )
}
