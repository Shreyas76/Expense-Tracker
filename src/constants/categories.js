// Variable expense categories shown in the Log Expense flow.
// Fixed categories (Rent, EMIs, Insurance) are auto-deducted and NOT listed here.
export const CATEGORIES = [
  { id: 'food', label: 'Food', emoji: '🍽️', color: '#f59e0b' },
  { id: 'fuel', label: 'Fuel', emoji: '⛽', color: '#ef4444' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒', color: '#10b981' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', color: '#8b5cf6' },
  { id: 'shopping', label: 'Shopping', emoji: '👗', color: '#ec4899' },
  { id: 'medical', label: 'Medical', emoji: '💊', color: '#06b6d4' },
  { id: 'transport', label: 'Transport', emoji: '🚕', color: '#f97316' },
  { id: 'other', label: 'Other', emoji: '📦', color: '#6b7280' }
]

export const CATEGORY_MAP = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c
  return acc
}, {})

export function getCategory(id) {
  return CATEGORY_MAP[id] || { id, label: id, emoji: '📦', color: '#6b7280' }
}
