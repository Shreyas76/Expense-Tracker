// Indian number formatting: ₹1,10,000 (lakh grouping), not ₹110,000.

export function formatINR(value, { decimals = false } = {}) {
  const num = Number(value) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0
  }).format(num)
}

// Number only, with Indian grouping (no ₹ symbol).
export function formatNumberIN(value) {
  const num = Number(value) || 0
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(num)
}

// Compact for tight spaces: ₹1.2L, ₹2.1L, ₹15K.
export function formatCompactINR(value) {
  const num = Number(value) || 0
  if (Math.abs(num) >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`
  if (Math.abs(num) >= 100000) return `₹${(num / 100000).toFixed(2)}L`
  if (Math.abs(num) >= 1000) return `₹${(num / 1000).toFixed(1)}K`
  return `₹${num}`
}
