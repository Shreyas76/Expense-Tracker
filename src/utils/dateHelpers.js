import { format, parse, differenceInCalendarMonths, addMonths } from 'date-fns'

export function currentMonthKey(date = new Date()) {
  return format(date, 'yyyy-MM')
}

export function monthLabel(key) {
  // key: "2026-07" -> "July 2026"
  try {
    const d = parse(key, 'yyyy-MM', new Date())
    return format(d, 'MMMM yyyy')
  } catch {
    return key
  }
}

export function shortMonthLabel(key) {
  try {
    const d = parse(key, 'yyyy-MM', new Date())
    return format(d, 'MMM yy')
  } catch {
    return key
  }
}

export function greetingForNow(date = new Date()) {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function todayLabel(date = new Date()) {
  return format(date, 'EEEE, d MMM')
}

export function formatTimestamp(ts) {
  try {
    return format(new Date(ts), 'd MMM, h:mm a')
  } catch {
    return ''
  }
}

// Previous month key relative to a given key.
export function prevMonthKey(key) {
  const d = parse(key, 'yyyy-MM', new Date())
  return format(addMonths(d, -1), 'yyyy-MM')
}

// Estimate completion: given current amount, monthly pace, and target,
// returns the month label when the goal is expected to be reached.
export function estimateCompletionMonth(current, monthlyPace, target, from = new Date()) {
  if (current >= target) return 'Reached 🎉'
  if (!monthlyPace || monthlyPace <= 0) return '—'
  const monthsLeft = Math.ceil((target - current) / monthlyPace)
  const d = addMonths(from, monthsLeft)
  return format(d, 'MMM yyyy')
}

export function monthsBetween(fromKey, toKey) {
  const a = parse(fromKey, 'yyyy-MM', new Date())
  const b = parse(toKey, 'yyyy-MM', new Date())
  return differenceInCalendarMonths(b, a)
}
