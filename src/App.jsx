import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { currentMonthKey } from './utils/dateHelpers'
import { useStorage } from './hooks/useStorage'
import { useMonthlyData } from './hooks/useMonthlyData'
import { useMonthRollover } from './hooks/useMonthRollover'
import { useNotifications } from './hooks/useNotifications'
import Dashboard from './components/Dashboard'
import ExpenseHistory from './components/ExpenseHistory'
import InvestmentProgress from './components/InvestmentProgress'
import Settings from './components/Settings'
import BottomNav from './components/BottomNav'
import ExpenseSheet from './components/ExpenseSheet'
import InvestSheet from './components/InvestSheet'
import PayBillSheet from './components/PayBillSheet'
import SnackBar from './components/SnackBar'
import MonthRolloverDialog from './components/MonthRolloverDialog'
import FixedExpensesDialog from './components/FixedExpensesDialog'
import Ripple from './components/Ripple'

function LoadingSkeleton() {
  return (
    <div className="px-4 pt-6">
      <div className="skeleton mb-2 h-6 w-40 rounded-lg" />
      <div className="skeleton mb-6 h-4 w-24 rounded-lg" />
      <div className="skeleton mb-4 h-56 w-full rounded-3xl" />
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-20 rounded-2xl" />
      </div>
      <div className="skeleton h-40 w-full rounded-3xl" />
    </div>
  )
}

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 }
}

export default function App() {
  const monthKey = currentMonthKey()
  const { data, setData, loading, clearAll } = useStorage(monthKey)
  const model = useMonthlyData({ data, setData, monthKey })
  const rollover = useMonthRollover({ data, setData, monthKey, loading })
  const notifications = useNotifications()

  const [tab, setTab] = useState('home')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [investOpen, setInvestOpen] = useState(false)
  const [editExpense, setEditExpense] = useState(null) // { mk, entry }
  const [editInvestment, setEditInvestment] = useState(null) // { mk, entry }
  const [fixedOpen, setFixedOpen] = useState(false)
  const [payBill, setPayBill] = useState(null) // { presetCardId } | null
  const [snack, setSnack] = useState(null)
  const snackTimer = useRef(null)
  const fixedAutoShown = useRef(false)

  const showSnack = useCallback((message, opts = {}) => {
    const s = { id: Date.now(), message, ...opts }
    setSnack(s)
    if (snackTimer.current) clearTimeout(snackTimer.current)
    snackTimer.current = setTimeout(() => setSnack(null), opts.duration || 3500)
    return s
  }, [])

  // In-app reminder toasts (fired by useNotifications when permission denied/unsupported).
  useEffect(() => {
    const handler = (e) => showSnack(`${e.detail.title}: ${e.detail.body}`)
    window.addEventListener('app-reminder', handler)
    return () => window.removeEventListener('app-reminder', handler)
  }, [showSnack])

  // PWA shortcut deep-links: /?action=expense | invest
  useEffect(() => {
    if (loading) return
    const params = new URLSearchParams(window.location.search)
    const action = params.get('action')
    if (action === 'expense') setExpenseOpen(true)
    if (action === 'invest') setInvestOpen(true)
    if (action) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [loading])

  // Ask for fixed expenses on the 1st / whenever the current month is unconfirmed.
  // Waits for any month-rollover dialog to be dismissed first.
  useEffect(() => {
    if (loading || !data) return
    if (!model.fixedConfirmed && !rollover.showDialog && !fixedAutoShown.current) {
      fixedAutoShown.current = true
      setFixedOpen(true)
    }
  }, [loading, data, model.fixedConfirmed, rollover.showDialog])

  // Android back button: close open sheets/dialogs first.
  useEffect(() => {
    const anyOpen = expenseOpen || investOpen || fixedOpen || !!payBill
    if (anyOpen) {
      window.history.pushState({ sheet: true }, '')
      const onPop = () => {
        setExpenseOpen(false)
        setInvestOpen(false)
        setFixedOpen(false)
        setPayBill(null)
        setEditExpense(null)
        setEditInvestment(null)
      }
      window.addEventListener('popstate', onPop)
      return () => window.removeEventListener('popstate', onPop)
    }
  }, [expenseOpen, investOpen, fixedOpen, payBill])

  // ---- Expense handlers ----
  const openAddExpense = () => {
    setEditExpense(null)
    setExpenseOpen(true)
  }

  const openEditExpense = (mk, entry) => {
    setEditExpense({ mk, entry })
    setExpenseOpen(true)
  }

  const submitExpense = (payload) => {
    if (editExpense) {
      model.updateExpenseAt(editExpense.mk, editExpense.entry.id, payload)
      showSnack('Expense updated 💾')
    } else {
      model.addExpense(payload)
      showSnack('Expense logged ✅')
    }
    setEditExpense(null)
  }

  const handleDeleteExpense = (mk, tx) => {
    const removed = model.deleteExpenseAt(mk, tx.id)
    showSnack('Expense deleted', {
      actionLabel: 'Undo',
      duration: 5000,
      onUndo: () => model.restoreExpenseAt(mk, removed)
    })
  }

  // ---- Investment handlers ----
  const openAddInvestment = () => {
    setEditInvestment(null)
    setInvestOpen(true)
  }

  const openEditInvestment = (entry) => {
    setEditInvestment({ mk: monthKey, entry })
    setInvestOpen(true)
  }

  const submitInvestment = (payload) => {
    if (editInvestment) {
      model.updateInvestmentAt(editInvestment.mk, editInvestment.entry.id, payload)
      showSnack('Investment updated 💾')
    } else {
      model.addInvestment(payload)
      showSnack(payload.exceeded ? 'Above target! 🎉 Investment logged 📈' : 'Investment logged 📈')
    }
    setEditInvestment(null)
  }

  const handleDeleteInvestment = (entry) => {
    const removed = model.deleteInvestmentAt(monthKey, entry.id)
    showSnack('Investment deleted', {
      actionLabel: 'Undo',
      duration: 5000,
      onUndo: () => model.restoreInvestmentAt(monthKey, removed)
    })
  }

  // ---- Monthly setup (in-hand + fixed) ----
  const confirmFixed = (items, salary) => {
    model.confirmFixed(monthKey, items, salary)
    setFixedOpen(false)
    showSnack('Monthly setup saved ✅')
  }

  const setSalary = (value) => {
    model.updateSalary(value)
    showSnack('In-hand updated 💾')
  }

  // ---- Card bill payment ----
  const openPayBill = (presetCardId) => setPayBill({ presetCardId: presetCardId || null })

  const submitPayBill = (payload) => {
    const entry = model.payCardBill(payload)
    setPayBill(null)
    showSnack('Bill paid — bank updated, not counted as expense 💸', {
      actionLabel: 'Undo',
      duration: 5000,
      onUndo: () => model.deletePaymentAt(monthKey, entry.id)
    })
  }

  if (loading || !data) {
    return (
      <div className="mx-auto min-h-full max-w-md">
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-full max-w-md safe-top">
      <AnimatePresence mode="wait">
        <motion.main
          key={tab}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {tab === 'home' && (
            <Dashboard
              model={model}
              monthKey={monthKey}
              onLogExpense={openAddExpense}
              onLogInvest={openAddInvestment}
              onSetSalary={setSalary}
              onPayBill={openPayBill}
            />
          )}
          {tab === 'expenses' && (
            <ExpenseHistory
              data={data}
              monthKey={monthKey}
              onDelete={handleDeleteExpense}
              onEdit={openEditExpense}
              sourceLabel={model.sourceLabel}
            />
          )}
          {tab === 'investments' && (
            <InvestmentProgress
              model={model}
              onEditInvestment={openEditInvestment}
              onDeleteInvestment={handleDeleteInvestment}
            />
          )}
          {tab === 'settings' && (
            <Settings
              data={data}
              model={model}
              notifications={notifications}
              onClearAll={clearAll}
              onToast={showSnack}
              onEditFixed={() => setFixedOpen(true)}
            />
          )}
        </motion.main>
      </AnimatePresence>

      {/* FABs (home only) */}
      {tab === 'home' && (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3">
          <Ripple
            onClick={openAddInvestment}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-xl shadow-lg ring-1 ring-white/10 active:scale-95"
            aria-label="Log investment"
          >
            📈
          </Ripple>
          <Ripple
            onClick={openAddExpense}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-light text-white shadow-xl shadow-primary/30 active:scale-95"
            aria-label="Log expense"
          >
            +
          </Ripple>
        </div>
      )}

      {/* Persistent bottom navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto max-w-md bg-surface/95 backdrop-blur">
          <BottomNav active={tab} onChange={setTab} />
        </div>
      </div>

      <ExpenseSheet
        open={expenseOpen}
        onClose={() => {
          setExpenseOpen(false)
          setEditExpense(null)
        }}
        onSubmit={submitExpense}
        editEntry={editExpense?.entry}
        paymentSources={model.paymentSources}
        defaultSource={model.defaultSource}
      />
      <InvestSheet
        open={investOpen}
        onClose={() => {
          setInvestOpen(false)
          setEditInvestment(null)
        }}
        buckets={model.bucketProgress}
        onSubmit={submitInvestment}
        editEntry={editInvestment?.entry}
        paymentSources={model.paymentSources}
        defaultSource={model.defaultSource}
      />

      <PayBillSheet
        open={!!payBill}
        onClose={() => setPayBill(null)}
        cards={model.cards}
        banks={model.banks}
        presetCardId={payBill?.presetCardId}
        onSubmit={submitPayBill}
      />

      <FixedExpensesDialog
        open={fixedOpen}
        monthKey={monthKey}
        template={model.fixedConfirmed ? model.monthlyFixed : model.fixedTemplate}
        salary={model.salary}
        paymentSources={model.paymentSources}
        defaultSource={model.defaultSource}
        dismissable={model.fixedConfirmed}
        onConfirm={confirmFixed}
        onClose={() => setFixedOpen(false)}
      />

      <SnackBar
        snack={snack}
        onAction={(s) => {
          s.onUndo?.()
          setSnack(null)
        }}
        onDismiss={() => setSnack(null)}
      />

      <MonthRolloverDialog
        open={rollover.showDialog}
        summary={rollover.summary}
        onClose={rollover.dismiss}
      />
    </div>
  )
}
