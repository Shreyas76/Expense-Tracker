import { useCallback, useEffect, useRef, useState } from 'react'
import localforage from 'localforage'
import {
  DEFAULT_SALARY,
  DEFAULT_FIXED_EXPENSES,
  DEFAULT_BANKS,
  DEFAULT_CARDS,
  DEFAULT_LIMIT_GROUPS,
  DEFAULT_SOURCE
} from '../constants/allocations'

const STORAGE_KEY = 'tracker-data-v1'

localforage.config({
  name: 'ExpenseTracker',
  storeName: 'tracker'
})

export function makeDefaultData(monthKey) {
  return {
    version: 3,
    salary: DEFAULT_SALARY,
    // Template used to pre-fill the monthly fixed-expense prompt (editable).
    fixedTemplate: DEFAULT_FIXED_EXPENSES.map((f) => ({ ...f })),
    // Editable bank balances (shown on Home behind a PIN).
    banks: DEFAULT_BANKS.map((b) => ({ ...b })),
    // Credit cards + their (optionally shared) limit groups.
    cards: DEFAULT_CARDS.map((c) => ({ ...c })),
    limitGroups: DEFAULT_LIMIT_GROUPS.map((g) => ({ ...g })),
    // Default mode of payment pre-selected in the expense sheet.
    defaultSource: { ...DEFAULT_SOURCE },
    phaseMode: 'auto', // 'auto' | 1 | 2
    currentMonth: monthKey,
    months: {
      // fixed/fixedConfirmed are set once the user confirms on the 1st of the month.
      [monthKey]: { expenses: [], investments: [], fixed: [], payments: [], fixedConfirmed: false }
    },
    cumulative: {},
    notificationsEnabled: false,
    lastRolloverMonth: monthKey,
    lastSummary: null // holds last month's summary for the rollover dialog
  }
}

// Upgrades older stored payloads to the current shape without losing data.
function migrate(stored, monthKey) {
  const prevVersion = stored.version || 0
  const d = { ...stored }
  if (!d.fixedTemplate) {
    d.fixedTemplate = (d.fixedExpenses || DEFAULT_FIXED_EXPENSES).map((f) => ({ ...f }))
  }
  delete d.fixedExpenses
  if (!Array.isArray(d.banks)) d.banks = DEFAULT_BANKS.map((b) => ({ ...b }))
  // v3: credit cards, shared limit groups, and default payment source.
  if (!Array.isArray(d.cards)) d.cards = DEFAULT_CARDS.map((c) => ({ ...c }))
  if (!Array.isArray(d.limitGroups)) d.limitGroups = DEFAULT_LIMIT_GROUPS.map((g) => ({ ...g }))
  if (!d.defaultSource) d.defaultSource = { ...DEFAULT_SOURCE }
  if (!d.months) d.months = {}
  Object.keys(d.months).forEach((k) => {
    const m = d.months[k]
    if (!Array.isArray(m.expenses)) m.expenses = []
    if (!Array.isArray(m.investments)) m.investments = []
    if (!Array.isArray(m.fixed)) m.fixed = []
    if (!Array.isArray(m.payments)) m.payments = []
    if (typeof m.fixedConfirmed !== 'boolean') m.fixedConfirmed = m.fixed.length > 0
  })
  if (!d.months[monthKey]) {
    d.months[monthKey] = { expenses: [], investments: [], fixed: [], payments: [], fixedConfirmed: false }
  }
  // v4: one-time seed of the known bank balances (only for older payloads).
  if (prevVersion < 4) {
    const seed = { hdfc: 194695, canara: 17176 }
    d.banks = d.banks.map((b) => (seed[b.id] != null ? { ...b, balance: seed[b.id] } : b))
  }
  // v5/v6/v7: drop fixed lines that are no longer applicable — PLI + RD (now tracked as
  // investments), the health-insurance items (paid in full for the year), and Misc.
  // Balances are left untouched (already seeded to the user's real values in v4).
  if (prevVersion < 7) {
    const removedFixedIds = ['pli_rd', 'health_self', 'health_parents', 'misc']
    const dropRemoved = (arr) => (arr || []).filter((f) => !removedFixedIds.includes(f.id))
    d.fixedTemplate = dropRemoved(d.fixedTemplate)
    Object.keys(d.months).forEach((k) => {
      const m = d.months[k]
      m.fixed = dropRemoved(m.fixed)
      if (Array.isArray(m.fixedApplied)) m.fixedApplied = dropRemoved(m.fixedApplied)
    })
  }
  d.version = 7
  return d
}

// Low-level persisted store. Returns [data, setData(updater), loading].
export function useStorage(monthKey) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const saveTimer = useRef(null)

  // Initial load from IndexedDB (localForage).
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const stored = await localforage.getItem(STORAGE_KEY)
        if (!mounted) return
        if (stored && stored.version) {
          setData(migrate(stored, monthKey))
        } else {
          setData(makeDefaultData(monthKey))
        }
      } catch (e) {
        setData(makeDefaultData(monthKey))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounced persistence on every change.
  useEffect(() => {
    if (!data) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localforage.setItem(STORAGE_KEY, data).catch(() => {})
    }, 150)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [data])

  const update = useCallback((updater) => {
    setData((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }, [])

  const clearAll = useCallback(async () => {
    await localforage.removeItem(STORAGE_KEY)
    setData(makeDefaultData(monthKey))
  }, [monthKey])

  return { data, setData: update, loading, clearAll }
}

export { STORAGE_KEY }
