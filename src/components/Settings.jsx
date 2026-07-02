import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Ripple from './Ripple'
import PinPrompt from './PinPrompt'
import { formatINR, formatNumberIN } from '../utils/formatCurrency'
import { buildCsv, downloadCsv } from '../utils/csvExport'

function ConfirmDialog({ open, title, message, confirmLabel, onConfirm, onCancel, danger }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="fixed inset-x-6 top-1/2 z-[71] mx-auto max-w-sm -translate-y-1/2 rounded-2xl bg-surface p-5 ring-1 ring-white/10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="mt-1 text-sm text-muted">{message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={onCancel} className="rounded-xl px-4 py-2 text-sm font-semibold text-muted active:bg-white/5">
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  danger ? 'bg-error' : 'bg-primary'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function Settings({ data, model, notifications, onClearAll, onToast, onEditFixed }) {
  const [salaryInput, setSalaryInput] = useState(String(model.salary))
  const [bankDraft, setBankDraft] = useState(() => {
    const d = {}
    ;(model.banks || []).forEach((b) => (d[b.id] = String(b.balance ?? '')))
    return d
  })
  const [cardDraft, setCardDraft] = useState(() => {
    const d = {}
    ;(model.cards || []).forEach((c) => (d[c.id] = String(c.spent ?? '')))
    return d
  })
  const [groupDraft, setGroupDraft] = useState(() => {
    const d = {}
    ;(model.limitGroups || []).forEach((g) => (d[g.id] = String(g.limit ?? '')))
    return d
  })
  const [confirm, setConfirm] = useState(null) // 'reset' | 'clear' | null
  const [balRevealed, setBalRevealed] = useState(false)
  const [askPin, setAskPin] = useState(false)

  const saveBanks = () => {
    model.banks.forEach((b) => model.updateBank(b.id, bankDraft[b.id]))
    onToast('Balances updated ✅')
  }

  const saveCards = () => {
    model.cards.forEach((c) => model.updateCard(c.id, { spent: cardDraft[c.id] }))
    model.limitGroups.forEach((g) => model.updateLimitGroup(g.id, groupDraft[g.id]))
    onToast('Cards updated ✅')
  }

  const sameSource = (a, b) => a && b && a.type === b.type && a.id === b.id

  const phaseMode = data.phaseMode

  const saveSalary = () => {
    model.updateSalary(salaryInput)
    onToast('Salary updated ✅')
  }

  const exportCsv = () => {
    const csv = buildCsv(data)
    downloadCsv(csv, `tracker-${new Date().toISOString().slice(0, 10)}.csv`)
    onToast('Exported CSV 📄')
  }

  const enableNotifications = async () => {
    const res = await notifications.requestPermission()
    onToast(res === 'granted' ? 'Reminders enabled 🔔' : 'Reminders not enabled')
  }

  return (
    <div className="px-4 pb-28 pt-2">
      <h1 className="mb-4 text-2xl font-extrabold text-white">Settings</h1>

      {/* Salary */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <h2 className="mb-2 text-sm font-bold text-white">Monthly In-Hand Salary</h2>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-xl bg-surface-2 px-3">
            <span className="text-muted">₹</span>
            <input
              type="number"
              inputMode="numeric"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
              className="w-full bg-transparent px-2 py-3 text-white outline-none"
            />
          </div>
          <Ripple onClick={saveSalary} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white">
            Save
          </Ripple>
        </div>
      </section>

      {/* Bank balances (masked behind PIN) */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Bank Balances</h2>
          {balRevealed ? (
            <button
              onClick={() => setBalRevealed(false)}
              className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted active:scale-95"
            >
              Hide
            </button>
          ) : (
            <button
              onClick={() => setAskPin(true)}
              className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary active:scale-95"
            >
              🔒 Reveal
            </button>
          )}
        </div>

        {balRevealed ? (
          <>
            <div className="space-y-2">
              {model.banks.map((b) => (
                <div key={b.id} className="flex items-center gap-2">
                  <span className="flex-1 truncate text-sm text-gray-300">{b.label}</span>
                  <div className="flex w-36 items-center rounded-lg bg-surface-2 px-2">
                    <span className="text-xs text-muted">₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={bankDraft[b.id] ?? ''}
                      onChange={(e) => setBankDraft((prev) => ({ ...prev, [b.id]: e.target.value }))}
                      className="w-full bg-transparent px-1 py-2 text-right text-sm text-white outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Ripple onClick={saveBanks} className="mt-3 w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white">
              Save balances
            </Ripple>
          </>
        ) : (
          <div className="space-y-2">
            {model.banks.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5">
                <span className="text-sm text-gray-300">{b.label}</span>
                <span className="text-sm font-bold tracking-widest text-muted">₹ ••••</span>
              </div>
            ))}
            <p className="pt-1 text-xs text-muted">Enter PIN to view or edit balances.</p>
          </div>
        )}
      </section>

      {/* Credit cards */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Credit Cards</h2>
          <span className="text-xs font-semibold text-warning">
            Due {formatINR(model.totalOutstanding)}
          </span>
        </div>

        <p className="mb-1 text-xs text-muted">Outstanding per card</p>
        <div className="space-y-2">
          {model.cards.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm text-gray-300">💳 {c.name}</span>
              <div className="flex w-36 items-center rounded-lg bg-surface-2 px-2">
                <span className="text-xs text-muted">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={cardDraft[c.id] ?? ''}
                  onChange={(e) => setCardDraft((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  className="w-full bg-transparent px-1 py-2 text-right text-sm text-white outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <p className="mb-1 mt-3 text-xs text-muted">Limits (shared per group)</p>
        <div className="space-y-2">
          {model.limitGroups.map((g) => (
            <div key={g.id} className="flex items-center gap-2">
              <span className="flex-1 truncate text-sm text-gray-300">{g.label}</span>
              <div className="flex w-36 items-center rounded-lg bg-surface-2 px-2">
                <span className="text-xs text-muted">₹</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={groupDraft[g.id] ?? ''}
                  onChange={(e) => setGroupDraft((prev) => ({ ...prev, [g.id]: e.target.value }))}
                  className="w-full bg-transparent px-1 py-2 text-right text-sm text-white outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <Ripple onClick={saveCards} className="mt-3 w-full rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-white">
          Save cards
        </Ripple>
      </section>

      {/* Default payment mode */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <h2 className="mb-1 text-sm font-bold text-white">Default Payment Mode</h2>
        <p className="mb-2 text-xs text-muted">Pre-selected when logging a new expense.</p>
        <div className="flex flex-wrap gap-2">
          {model.paymentSources.map((s) => (
            <button
              key={`${s.type}-${s.id}`}
              onClick={() => {
                model.setDefaultSource({ type: s.type, id: s.id })
                onToast('Default updated ✅')
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                sameSource(model.defaultSource, s) ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
              }`}
            >
              {s.type === 'card' ? '💳' : '🏦'} {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Fixed expenses */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">Fixed Monthly Expenses</h2>
          <span className="text-xs font-semibold text-warning">{formatINR(model.fixedTotal)}</span>
        </div>
        <p className="mb-3 text-xs text-muted">
          {model.fixedConfirmed
            ? 'Confirmed for this month. Tap to edit line items and amounts.'
            : 'Not set for this month yet — add them now.'}
        </p>
        {model.monthlyFixed.length > 0 && (
          <div className="mb-3 space-y-1">
            {model.monthlyFixed.map((f) => (
              <div key={f.id} className="flex justify-between text-xs">
                <span className="truncate text-gray-400">{f.label}</span>
                <span className="text-gray-300">{formatINR(f.amount)}</span>
              </div>
            ))}
          </div>
        )}
        <Ripple onClick={onEditFixed} className="w-full rounded-xl bg-surface-2 py-2.5 text-center text-sm font-semibold text-white">
          {model.fixedConfirmed ? 'Edit fixed expenses' : 'Set fixed expenses'}
        </Ripple>
      </section>

      {/* Phase toggle */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <h2 className="mb-2 text-sm font-bold text-white">Investment Phase</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'auto', label: 'Auto' },
            { id: 1, label: 'Phase 1' },
            { id: 2, label: 'Phase 2' }
          ].map((opt) => (
            <button
              key={String(opt.id)}
              onClick={() => model.setPhaseMode(opt.id)}
              className={`rounded-xl py-2.5 text-sm font-semibold ${
                phaseMode === opt.id ? 'bg-primary text-white' : 'bg-surface-2 text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">
          Currently applying Phase {model.phase} allocations.
        </p>
      </section>

      {/* Notifications */}
      <section className="mb-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Reminders</h2>
            <p className="text-xs text-muted">
              {notifications.supported
                ? notifications.permission === 'granted'
                  ? 'Enabled · daily 9pm, 25th & 1st'
                  : 'Get daily & monthly nudges'
                : 'Not supported on this device'}
            </p>
          </div>
          {notifications.permission !== 'granted' && notifications.supported && (
            <Ripple onClick={enableNotifications} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
              Enable
            </Ripple>
          )}
          {notifications.permission === 'granted' && <span className="text-success">🔔</span>}
        </div>
      </section>

      {/* Data actions */}
      <section className="mb-4 space-y-2">
        <Ripple onClick={exportCsv} className="flex w-full items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-white/5 active:scale-[0.99]">
          <span className="text-sm font-semibold text-white">Export data as CSV</span>
          <span>📄</span>
        </Ripple>
        <Ripple
          onClick={() => setConfirm('reset')}
          className="flex w-full items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-white/5 active:scale-[0.99]"
        >
          <span className="text-sm font-semibold text-warning">Reset current month</span>
          <span>♻️</span>
        </Ripple>
        <Ripple
          onClick={() => setConfirm('clear')}
          className="flex w-full items-center justify-between rounded-2xl bg-surface p-4 ring-1 ring-error/20 active:scale-[0.99]"
        >
          <span className="text-sm font-semibold text-error">Clear all data</span>
          <span>🗑️</span>
        </Ripple>
      </section>

      <p className="text-center text-xs text-muted">
        Surplus this month: {formatINR(model.remaining)} · {formatNumberIN(model.salary)} in-hand
      </p>

      <ConfirmDialog
        open={confirm === 'reset'}
        title="Reset current month?"
        message="This clears all expenses and investments logged this month. Cumulative goal totals are kept."
        confirmLabel="Reset"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          model.resetCurrentMonth()
          setConfirm(null)
          onToast('Current month reset ♻️')
        }}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        title="Clear all data?"
        message="This permanently deletes everything — all months, investments and goal progress. This cannot be undone."
        confirmLabel="Delete all"
        danger
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          onClearAll()
          setConfirm(null)
          onToast('All data cleared')
        }}
      />

      <PinPrompt open={askPin} onClose={() => setAskPin(false)} onSuccess={() => setBalRevealed(true)} />
    </div>
  )
}
