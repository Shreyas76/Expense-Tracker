import { useCallback, useMemo } from 'react'
import { getAllocations, getCurrentPhase } from '../constants/allocations'
import { GOALS } from '../constants/goals'
import { getCategory } from '../constants/categories'

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const emptyMonth = () => ({
  expenses: [],
  investments: [],
  fixed: [],
  payments: [],
  fixedConfirmed: false
})

// Applies a spend of `delta` (positive = spend, negative = reverse) from a payment
// source to the balances: a bank's balance goes down, a card's outstanding goes up.
function ledger(banks, cards, source, delta) {
  if (!source || !delta) return { banks, cards }
  const amt = Number(delta) || 0
  if (source.type === 'bank') {
    return {
      banks: banks.map((b) =>
        b.id === source.id ? { ...b, balance: Number(b.balance || 0) - amt } : b
      ),
      cards
    }
  }
  if (source.type === 'card') {
    return {
      banks,
      cards: cards.map((c) =>
        c.id === source.id ? { ...c, spent: Number(c.spent || 0) + amt } : c
      )
    }
  }
  return { banks, cards }
}

// Central data model + actions, built on top of the persisted store.
export function useMonthlyData({ data, setData, monthKey }) {
  const month = data?.months?.[monthKey] || emptyMonth()

  const phase = useMemo(() => {
    if (!data) return 1
    if (data.phaseMode === 1 || data.phaseMode === 2) return data.phaseMode
    return getCurrentPhase()
  }, [data])

  const allocations = useMemo(() => getAllocations(phase), [phase])

  const fixedConfirmed = !!month.fixedConfirmed
  const monthlyFixed = month.fixed || []
  const fixedTotal = useMemo(
    () => monthlyFixed.reduce((s, f) => s + Number(f.amount || 0), 0),
    [monthlyFixed]
  )

  const investedThisMonth = useMemo(
    () => (month.investments || []).reduce((s, i) => s + Number(i.amount || 0), 0),
    [month]
  )

  const spentThisMonth = useMemo(
    () => (month.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0),
    [month]
  )

  const salary = month.salary != null ? Number(month.salary) : Number(data?.salary || 0)
  const salaryConfirmed = month.salary != null
  const banks = data?.banks || []
  const cards = data?.cards || []
  const limitGroups = data?.limitGroups || []
  const defaultSource = data?.defaultSource || null
  const fixedTemplate = data?.fixedTemplate || []
  const remaining = salary - fixedTotal - investedThisMonth - spentThisMonth

  const totalBank = useMemo(
    () => banks.reduce((s, b) => s + Number(b.balance || 0), 0),
    [banks]
  )
  const totalOutstanding = useMemo(
    () => cards.reduce((s, c) => s + Number(c.spent || 0), 0),
    [cards]
  )

  // Selectable payment sources for the expense / fixed pickers.
  const paymentSources = useMemo(
    () => [
      ...banks.map((b) => ({ type: 'bank', id: b.id, label: b.label })),
      ...cards.map((c) => ({ type: 'card', id: c.id, label: c.name }))
    ],
    [banks, cards]
  )

  const sourceLabel = useCallback(
    (source) => {
      if (!source) return '—'
      if (source.type === 'bank') return banks.find((b) => b.id === source.id)?.label || 'Bank'
      if (source.type === 'card') return cards.find((c) => c.id === source.id)?.name || 'Card'
      return '—'
    },
    [banks, cards]
  )

  // Per-card outstanding + shared-limit-group availability & utilization.
  const cardProgress = useMemo(() => {
    const groupSpent = {}
    cards.forEach((c) => {
      groupSpent[c.groupId] = (groupSpent[c.groupId] || 0) + Number(c.spent || 0)
    })
    return cards.map((c) => {
      const group = limitGroups.find((g) => g.id === c.groupId)
      const limit = Number(group?.limit || 0)
      const spentInGroup = groupSpent[c.groupId] || 0
      const available = Math.max(0, limit - spentInGroup)
      const utilization = limit > 0 ? Math.min(100, (spentInGroup / limit) * 100) : 0
      return {
        ...c,
        groupLabel: group?.label || '',
        limit,
        spentInGroup,
        available,
        utilization,
        shared: cards.filter((x) => x.groupId === c.groupId).length > 1
      }
    })
  }, [cards, limitGroups])

  const bucketProgress = useMemo(() => {
    const byBucket = {}
    ;(month.investments || []).forEach((inv) => {
      byBucket[inv.bucketId] = (byBucket[inv.bucketId] || 0) + Number(inv.amount || 0)
    })
    return allocations.map((a) => {
      const invested = byBucket[a.id] || 0
      const pct = a.target > 0 ? Math.min(100, (invested / a.target) * 100) : 0
      let status = 'behind'
      if (invested >= a.target) status = 'done'
      else if (invested > 0) status = 'ontrack'
      return { ...a, invested, pct, status, remaining: Math.max(0, a.target - invested) }
    })
  }, [allocations, month])

  const goalProgress = useMemo(() => {
    const cumulative = data?.cumulative || {}
    return GOALS.map((g) => {
      const current = cumulative[g.id] || 0
      const pct = g.target > 0 ? Math.min(100, (current / g.target) * 100) : 0
      return { ...g, current, pct, remaining: Math.max(0, g.target - current) }
    })
  }, [data])

  const categoryBreakdown = useMemo(() => {
    const byCat = {}
    ;(month.expenses || []).forEach((e) => {
      byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount || 0)
    })
    return Object.entries(byCat)
      .map(([id, value]) => ({ id, value, ...getCategory(id) }))
      .sort((a, b) => b.value - a.value)
  }, [month])

  const monthInvestments = useMemo(
    () => [...(month.investments || [])].sort((a, b) => b.ts - a.ts),
    [month]
  )

  const recentTransactions = useMemo(() => {
    const exp = (month.expenses || []).map((e) => ({ ...e, kind: 'expense' }))
    const inv = (month.investments || []).map((i) => ({ ...i, kind: 'investment' }))
    const pay = (month.payments || []).map((p) => ({ ...p, kind: 'payment' }))
    return [...exp, ...inv, ...pay].sort((a, b) => b.ts - a.ts)
  }, [month])

  // ---- Helpers ----
  const patchMonth = useCallback(
    (mk, fn) =>
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        return { ...prev, months: { ...prev.months, [mk]: fn(m, prev) } }
      }),
    [setData]
  )

  // ---- Expense actions (source-aware; update the ledger) ----
  const addExpense = useCallback(
    ({ category, amount, note, source }) => {
      const src = source || defaultSource
      const entry = {
        id: uid(),
        category,
        amount: Number(amount),
        note: note || '',
        source: src,
        ts: Date.now()
      }
      setData((prev) => {
        const m = prev.months[monthKey] || emptyMonth()
        const led = ledger(prev.banks, prev.cards, src, entry.amount)
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          defaultSource: src || prev.defaultSource,
          months: { ...prev.months, [monthKey]: { ...m, expenses: [entry, ...(m.expenses || [])] } }
        }
      })
      return entry
    },
    [setData, monthKey, defaultSource]
  )

  const updateExpenseAt = useCallback(
    (mk, id, patch) => {
      setData((prev) => {
        const m = prev.months[mk]
        if (!m) return prev
        const existing = (m.expenses || []).find((e) => e.id === id)
        if (!existing) return prev
        const newAmount = patch.amount != null ? Number(patch.amount) : existing.amount
        const newSource = patch.source || existing.source
        // Reverse the old ledger effect, then apply the new one.
        let led = ledger(prev.banks, prev.cards, existing.source, -Number(existing.amount || 0))
        led = ledger(led.banks, led.cards, newSource, newAmount)
        const updated = { ...existing, ...patch, amount: newAmount, source: newSource }
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          defaultSource: newSource || prev.defaultSource,
          months: {
            ...prev.months,
            [mk]: { ...m, expenses: (m.expenses || []).map((e) => (e.id === id ? updated : e)) }
          }
        }
      })
    },
    [setData]
  )

  const deleteExpenseAt = useCallback(
    (mk, id) => {
      const removed = data?.months?.[mk]?.expenses?.find((e) => e.id === id) || null
      setData((prev) => {
        const m = prev.months[mk]
        if (!m) return prev
        const target = (m.expenses || []).find((e) => e.id === id)
        if (!target) return prev
        const led = ledger(prev.banks, prev.cards, target.source, -Number(target.amount || 0))
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          months: { ...prev.months, [mk]: { ...m, expenses: (m.expenses || []).filter((e) => e.id !== id) } }
        }
      })
      return removed
    },
    [setData, data]
  )

  const restoreExpenseAt = useCallback(
    (mk, entry) => {
      if (!entry) return
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        if ((m.expenses || []).some((e) => e.id === entry.id)) return prev
        const led = ledger(prev.banks, prev.cards, entry.source, Number(entry.amount || 0))
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          months: {
            ...prev.months,
            [mk]: { ...m, expenses: [entry, ...(m.expenses || [])].sort((a, b) => b.ts - a.ts) }
          }
        }
      })
    },
    [setData]
  )

  const deleteExpense = useCallback((id) => deleteExpenseAt(monthKey, id), [deleteExpenseAt, monthKey])
  const restoreExpense = useCallback((e) => restoreExpenseAt(monthKey, e), [restoreExpenseAt, monthKey])

  // ---- Investment actions (unchanged; not part of the bank/card ledger) ----
  const addInvestment = useCallback(
    ({ bucketId, amount, note, source }) => {
      const bucket = allocations.find((a) => a.id === bucketId)
      const src = source || null
      const entry = {
        id: uid(),
        bucketId,
        bucketName: bucket?.name || bucketId,
        goalId: bucket?.goalId || null,
        amount: Number(amount),
        note: note || '',
        source: src,
        ts: Date.now()
      }
      setData((prev) => {
        const m = prev.months[monthKey] || emptyMonth()
        const cumulative = { ...(prev.cumulative || {}) }
        if (entry.goalId) cumulative[entry.goalId] = (cumulative[entry.goalId] || 0) + entry.amount
        const led = ledger(prev.banks, prev.cards, src, entry.amount)
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          cumulative,
          months: { ...prev.months, [monthKey]: { ...m, investments: [entry, ...(m.investments || [])] } }
        }
      })
      return entry
    },
    [setData, monthKey, allocations]
  )

  const updateInvestmentAt = useCallback(
    (mk, id, { bucketId, amount, note, source }) => {
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        const existing = (m.investments || []).find((i) => i.id === id)
        if (!existing) return prev
        const bucket = allocations.find((a) => a.id === bucketId) || {}
        const newAmount = amount != null ? Number(amount) : existing.amount
        const newGoalId = bucketId ? bucket.goalId || null : existing.goalId
        const newSource = source !== undefined ? source : existing.source
        const cumulative = { ...(prev.cumulative || {}) }
        if (existing.goalId) cumulative[existing.goalId] = (cumulative[existing.goalId] || 0) - existing.amount
        if (newGoalId) cumulative[newGoalId] = (cumulative[newGoalId] || 0) + newAmount
        // Reverse the old ledger effect, then apply the new one.
        let led = ledger(prev.banks, prev.cards, existing.source, -Number(existing.amount || 0))
        led = ledger(led.banks, led.cards, newSource, newAmount)
        const updated = {
          ...existing,
          bucketId: bucketId || existing.bucketId,
          bucketName: bucketId ? bucket.name || bucketId : existing.bucketName,
          goalId: newGoalId,
          amount: newAmount,
          source: newSource,
          note: note != null ? note : existing.note
        }
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          cumulative,
          months: {
            ...prev.months,
            [mk]: { ...m, investments: (m.investments || []).map((i) => (i.id === id ? updated : i)) }
          }
        }
      })
    },
    [setData, allocations]
  )

  const deleteInvestmentAt = useCallback(
    (mk, id) => {
      const removed = data?.months?.[mk]?.investments?.find((i) => i.id === id) || null
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        const target = (m.investments || []).find((i) => i.id === id)
        if (!target) return prev
        const cumulative = { ...(prev.cumulative || {}) }
        if (target.goalId) {
          cumulative[target.goalId] = Math.max(0, (cumulative[target.goalId] || 0) - target.amount)
        }
        const led = ledger(prev.banks, prev.cards, target.source, -Number(target.amount || 0))
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          cumulative,
          months: { ...prev.months, [mk]: { ...m, investments: (m.investments || []).filter((i) => i.id !== id) } }
        }
      })
      return removed
    },
    [setData, data]
  )

  const restoreInvestmentAt = useCallback(
    (mk, entry) => {
      if (!entry) return
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        if ((m.investments || []).some((i) => i.id === entry.id)) return prev
        const cumulative = { ...(prev.cumulative || {}) }
        if (entry.goalId) cumulative[entry.goalId] = (cumulative[entry.goalId] || 0) + entry.amount
        const led = ledger(prev.banks, prev.cards, entry.source, Number(entry.amount || 0))
        return {
          ...prev,
          banks: led.banks,
          cards: led.cards,
          cumulative,
          months: {
            ...prev.months,
            [mk]: { ...m, investments: [entry, ...(m.investments || [])].sort((a, b) => b.ts - a.ts) }
          }
        }
      })
    },
    [setData]
  )

  // ---- Card bill payments (bank down, card outstanding down) ----
  const payCardBill = useCallback(
    ({ cardId, bankId, amount }) => {
      const amt = Number(amount) || 0
      const entry = { id: uid(), cardId, bankId, amount: amt, ts: Date.now() }
      setData((prev) => {
        const m = prev.months[monthKey] || emptyMonth()
        const banks2 = prev.banks.map((b) =>
          b.id === bankId ? { ...b, balance: Number(b.balance || 0) - amt } : b
        )
        const cards2 = prev.cards.map((c) =>
          c.id === cardId ? { ...c, spent: Math.max(0, Number(c.spent || 0) - amt) } : c
        )
        return {
          ...prev,
          banks: banks2,
          cards: cards2,
          months: { ...prev.months, [monthKey]: { ...m, payments: [entry, ...(m.payments || [])] } }
        }
      })
      return entry
    },
    [setData, monthKey]
  )

  const deletePaymentAt = useCallback(
    (mk, id) => {
      const removed = data?.months?.[mk]?.payments?.find((p) => p.id === id) || null
      setData((prev) => {
        const m = prev.months[mk]
        if (!m) return prev
        const target = (m.payments || []).find((p) => p.id === id)
        if (!target) return prev
        const amt = Number(target.amount || 0)
        const banks2 = prev.banks.map((b) =>
          b.id === target.bankId ? { ...b, balance: Number(b.balance || 0) + amt } : b
        )
        const cards2 = prev.cards.map((c) =>
          c.id === target.cardId ? { ...c, spent: Number(c.spent || 0) + amt } : c
        )
        return {
          ...prev,
          banks: banks2,
          cards: cards2,
          months: { ...prev.months, [mk]: { ...m, payments: (m.payments || []).filter((p) => p.id !== id) } }
        }
      })
      return removed
    },
    [setData, data]
  )

  const restorePaymentAt = useCallback(
    (mk, entry) => {
      if (!entry) return
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        if ((m.payments || []).some((p) => p.id === entry.id)) return prev
        const amt = Number(entry.amount || 0)
        const banks2 = prev.banks.map((b) =>
          b.id === entry.bankId ? { ...b, balance: Number(b.balance || 0) - amt } : b
        )
        const cards2 = prev.cards.map((c) =>
          c.id === entry.cardId ? { ...c, spent: Math.max(0, Number(c.spent || 0) - amt) } : c
        )
        return {
          ...prev,
          banks: banks2,
          cards: cards2,
          months: {
            ...prev.months,
            [mk]: { ...m, payments: [entry, ...(m.payments || [])].sort((a, b) => b.ts - a.ts) }
          }
        }
      })
    },
    [setData]
  )

  // ---- Monthly setup: in-hand salary + fixed expenses (applied to the ledger) ----
  const confirmFixed = useCallback(
    (mk, items, salaryValue) => {
      const clean = items
        .filter((i) => i.label && i.label.trim())
        .map((i) => ({
          id: i.id || uid(),
          label: i.label.trim(),
          amount: Number(i.amount) || 0,
          source: i.source || null
        }))
      const sal = Number(salaryValue) || 0
      setData((prev) => {
        const m = prev.months[mk] || emptyMonth()
        let banks2 = prev.banks
        let cards2 = prev.cards
        // Reverse whatever fixed was previously applied for this month, then apply the new set.
        ;(m.fixedApplied || []).forEach((f) => {
          const led = ledger(banks2, cards2, f.source, -Number(f.amount || 0))
          banks2 = led.banks
          cards2 = led.cards
        })
        clean.forEach((f) => {
          const led = ledger(banks2, cards2, f.source, Number(f.amount || 0))
          banks2 = led.banks
          cards2 = led.cards
        })
        return {
          ...prev,
          banks: banks2,
          cards: cards2,
          salary: sal,
          fixedTemplate: clean.map((c) => ({ ...c })),
          months: {
            ...prev.months,
            [mk]: {
              ...m,
              salary: sal,
              fixed: clean,
              fixedApplied: clean.map((c) => ({ ...c })),
              fixedConfirmed: true
            }
          }
        }
      })
    },
    [setData]
  )

  // ---- Settings / misc ----
  const updateSalary = useCallback(
    (value) => {
      const sal = Number(value) || 0
      patchMonth(monthKey, (m) => ({ ...m, salary: sal }))
      setData((prev) => ({ ...prev, salary: sal }))
    },
    [patchMonth, setData, monthKey]
  )

  const updateBank = useCallback(
    (id, balance) =>
      setData((prev) => ({
        ...prev,
        banks: (prev.banks || []).map((b) =>
          b.id === id ? { ...b, balance: Number(balance) || 0 } : b
        )
      })),
    [setData]
  )

  const updateCard = useCallback(
    (id, patch) =>
      setData((prev) => ({
        ...prev,
        cards: (prev.cards || []).map((c) =>
          c.id === id
            ? { ...c, ...patch, spent: patch.spent != null ? Number(patch.spent) || 0 : c.spent }
            : c
        )
      })),
    [setData]
  )

  const updateLimitGroup = useCallback(
    (id, limit) =>
      setData((prev) => ({
        ...prev,
        limitGroups: (prev.limitGroups || []).map((g) =>
          g.id === id ? { ...g, limit: Number(limit) || 0 } : g
        )
      })),
    [setData]
  )

  const setDefaultSource = useCallback(
    (source) => setData((prev) => ({ ...prev, defaultSource: source })),
    [setData]
  )

  const setPhaseMode = useCallback(
    (mode) => setData((prev) => ({ ...prev, phaseMode: mode })),
    [setData]
  )

  const setCumulative = useCallback(
    (goalId, value) =>
      setData((prev) => ({
        ...prev,
        cumulative: { ...(prev.cumulative || {}), [goalId]: Number(value) || 0 }
      })),
    [setData]
  )

  // Reverses every ledger effect logged this month, then clears the month.
  const resetCurrentMonth = useCallback(() => {
    setData((prev) => {
      const m = prev.months[monthKey]
      if (!m) return prev
      let banks2 = prev.banks
      let cards2 = prev.cards
      ;(m.expenses || []).forEach((e) => {
        const led = ledger(banks2, cards2, e.source, -Number(e.amount || 0))
        banks2 = led.banks
        cards2 = led.cards
      })
      ;(m.fixedApplied || []).forEach((f) => {
        const led = ledger(banks2, cards2, f.source, -Number(f.amount || 0))
        banks2 = led.banks
        cards2 = led.cards
      })
      ;(m.payments || []).forEach((p) => {
        banks2 = banks2.map((b) =>
          b.id === p.bankId ? { ...b, balance: Number(b.balance || 0) + Number(p.amount || 0) } : b
        )
        cards2 = cards2.map((c) =>
          c.id === p.cardId ? { ...c, spent: Number(c.spent || 0) + Number(p.amount || 0) } : c
        )
      })
      const cumulative = { ...(prev.cumulative || {}) }
      ;(m.investments || []).forEach((inv) => {
        if (inv.goalId) {
          cumulative[inv.goalId] = Math.max(0, (cumulative[inv.goalId] || 0) - Number(inv.amount || 0))
        }
        const led = ledger(banks2, cards2, inv.source, -Number(inv.amount || 0))
        banks2 = led.banks
        cards2 = led.cards
      })
      return {
        ...prev,
        banks: banks2,
        cards: cards2,
        cumulative,
        months: { ...prev.months, [monthKey]: emptyMonth() }
      }
    })
  }, [setData, monthKey])

  return {
    // state
    salary,
    salaryConfirmed,
    banks,
    cards,
    limitGroups,
    defaultSource,
    paymentSources,
    phase,
    allocations,
    month,
    monthlyFixed,
    fixedTemplate,
    fixedConfirmed,
    // computed
    fixedTotal,
    investedThisMonth,
    spentThisMonth,
    remaining,
    totalBank,
    totalOutstanding,
    cardProgress,
    bucketProgress,
    goalProgress,
    categoryBreakdown,
    monthInvestments,
    recentTransactions,
    sourceLabel,
    // expense actions
    addExpense,
    updateExpenseAt,
    deleteExpense,
    restoreExpense,
    deleteExpenseAt,
    restoreExpenseAt,
    // investment actions
    addInvestment,
    updateInvestmentAt,
    deleteInvestmentAt,
    restoreInvestmentAt,
    // card actions
    payCardBill,
    deletePaymentAt,
    restorePaymentAt,
    updateCard,
    updateLimitGroup,
    setDefaultSource,
    // fixed + settings
    confirmFixed,
    updateSalary,
    updateBank,
    setPhaseMode,
    setCumulative,
    resetCurrentMonth
  }
}
