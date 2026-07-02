import { useEffect, useRef, useState } from 'react'
import { getCurrentPhase } from '../constants/allocations'

// Detects month changes and produces a summary of the closing month.
// On a new month, monthly counters reset naturally (new month bucket),
// while cumulative totals carry forward untouched.
export function useMonthRollover({ data, setData, monthKey, loading }) {
  const [summary, setSummary] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const handled = useRef(false)

  useEffect(() => {
    if (loading || !data || handled.current) return

    const storedMonth = data.currentMonth
    if (storedMonth && storedMonth !== monthKey) {
      handled.current = true

      const closing = data.months?.[storedMonth]
      let built = null
      if (closing) {
        const spent = (closing.expenses || []).reduce((s, e) => s + Number(e.amount || 0), 0)
        const invested = (closing.investments || []).reduce((s, i) => s + Number(i.amount || 0), 0)
        const fixed = (closing.fixed || []).reduce((s, f) => s + Number(f.amount || 0), 0)
        const salary = closing.salary != null ? Number(closing.salary) : Number(data.salary || 0)
        const remaining = salary - fixed - spent - invested
        // Savings rate = everything kept back (invested + leftover balance) / salary.
        const savingsRate =
          salary > 0 ? Math.round(((invested + Math.max(0, remaining)) / salary) * 100) : 0

        built = { month: storedMonth, spent, invested, fixed, salary, savingsRate, remaining }
        setSummary(built)
        setShowDialog(true)
      }

      setData((prev) => {
        const months = { ...prev.months }
        if (!months[monthKey]) {
          months[monthKey] = { expenses: [], investments: [], fixed: [], payments: [], fixedConfirmed: false }
        }
        return {
          ...prev,
          months,
          currentMonth: monthKey,
          lastRolloverMonth: monthKey,
          lastSummary: built
        }
      })
    } else if (storedMonth !== monthKey) {
      // no stored month yet; just set it
      setData((prev) => ({ ...prev, currentMonth: monthKey }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, data, monthKey])

  const dismiss = () => setShowDialog(false)

  return { summary, showDialog, dismiss, autoPhase: getCurrentPhase() }
}
