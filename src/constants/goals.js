// Cumulative (persistent) goal targets. These carry forward across months.
export const GOALS = [
  {
    id: 'emergency',
    name: 'Emergency Fund',
    target: 200000,
    icon: '🛟',
    color: '#10b981',
    note: 'Target: ~8 months'
  },
  {
    id: 'marriage',
    name: 'Marriage Fund',
    target: 400000,
    icon: '💍',
    color: '#ec4899',
    note: 'Target: Dec 2026'
  },
  {
    id: 'honeymoon',
    name: 'Honeymoon Fund',
    target: 500000,
    icon: '✈️',
    color: '#6366f1',
    note: 'Switzerland, 10 days · Jan 2027'
  }
]

export const GOAL_MAP = GOALS.reduce((acc, g) => {
  acc[g.id] = g
  return acc
}, {})
