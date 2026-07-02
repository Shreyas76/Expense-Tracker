// Default financial context and phase-based investment allocations.

export const DEFAULT_SALARY = 210109

// Bank accounts whose balances are tracked (editable).
export const DEFAULT_BANKS = [
  { id: 'hdfc', label: 'HDFC', balance: 194695 },
  { id: 'canara', label: 'Canara', balance: 17176 }
]

// Credit-card limit groups. Cards in the same group share one limit (e.g. both Axis cards).
export const DEFAULT_LIMIT_GROUPS = [
  { id: 'hdfc', label: 'HDFC', limit: 550000 },
  { id: 'axis', label: 'Axis (shared)', limit: 255000 }
]

// Credit cards. `spent` is the current outstanding due on the card.
export const DEFAULT_CARDS = [
  { id: 'hdfc_regalia', name: 'HDFC Regalia Gold', groupId: 'hdfc', spent: 0 },
  { id: 'axis_ace', name: 'Axis Ace', groupId: 'axis', spent: 75246 },
  { id: 'axis_neo', name: 'Axis Neo', groupId: 'axis', spent: 2198 }
]

// Pre-selected mode of payment when logging a new expense (editable in Settings).
export const DEFAULT_SOURCE = { type: 'card', id: 'axis_ace' }

// Suggested fixed-expense template used to pre-fill the monthly prompt.
// These are NOT auto-applied — the user confirms/edits them on the 1st of each month.
// `source` is the default mode of payment for that item (bank or card).
export const DEFAULT_FIXED_EXPENSES = [
  { id: 'rent', label: 'Rent', amount: 6333, source: { type: 'bank', id: 'hdfc' } },
  { id: 'food_fixed', label: 'Food', amount: 10000, source: { type: 'card', id: 'axis_ace' } },
  { id: 'fuel_fixed', label: 'Fuel', amount: 5000, source: { type: 'card', id: 'axis_ace' } },
  { id: 'subscriptions', label: 'Subscriptions', amount: 2000, source: { type: 'card', id: 'axis_ace' } },
  { id: 'edu_loan', label: 'Education Loan EMI', amount: 5500, source: { type: 'bank', id: 'hdfc' } },
  { id: 'car_loan', label: 'Car Loan EMI', amount: 15500, source: { type: 'bank', id: 'hdfc' } }
]

export const PHASE1 = { startMonth: '2026-07', endMonth: '2026-12' }
export const PHASE2 = { startMonth: '2027-01' }

// Each bucket maps to a cumulative goal via `goalId` (optional).
export const PHASE1_ALLOCATIONS = [
  { id: 'emergency', name: 'Emergency Fund', fund: 'SBI Liquid Fund', target: 25000, goalId: 'emergency', icon: '🛟' },
  { id: 'marriage', name: 'Marriage Savings', fund: 'Savings', target: 45000, goalId: 'marriage', icon: '💍', keepInAccount: true },
  { id: 'honeymoon', name: 'Honeymoon Fund', fund: 'Switzerland', target: 30000, goalId: 'honeymoon', icon: '✈️' },
  { id: 'nifty50', name: 'Nifty 50 SIP', fund: 'Navi Nifty 50 Direct Growth', target: 10000, icon: '📈' },
  { id: 'niftynext50', name: 'Nifty Next 50 SIP', fund: 'UTI Nifty Next 50 Direct Growth', target: 10000, icon: '📊' },
  { id: 'pli', name: 'PLI', fund: 'Postal Life Insurance', target: 4600, icon: '📮' },
  { id: 'rd1', name: 'RD 1', fund: 'Recurring Deposit', target: 1000, icon: '💰' },
  { id: 'rd2', name: 'RD 2', fund: 'Recurring Deposit', target: 1000, icon: '💰' }
]

export const PHASE2_ALLOCATIONS = [
  { id: 'emergency', name: 'Emergency Fund top-up', fund: 'SBI Liquid Fund', target: 5000, goalId: 'emergency', icon: '🛟' },
  { id: 'nifty50', name: 'Nifty 50 SIP', fund: 'Navi Nifty 50 Direct Growth', target: 15000, icon: '📈' },
  { id: 'niftynext50', name: 'Nifty Next 50 SIP', fund: 'UTI Nifty Next 50 Direct Growth', target: 10000, icon: '📊' },
  { id: 'flexicap', name: 'Flexi Cap Fund', fund: 'Parag Parikh Flexi Cap Direct Growth', target: 10000, icon: '🌐' },
  { id: 'smallcap', name: 'Small Cap Fund', fund: 'Nippon India Small Cap Direct Growth', target: 8000, icon: '🚀' },
  { id: 'travel', name: 'Travel Fund', fund: 'Savings', target: 10000, icon: '🧳' },
  { id: 'house', name: 'House Down Payment', fund: 'HDFC Short Term Debt Fund', target: 25000, goalId: 'house', icon: '🏠' },
  { id: 'pli', name: 'PLI', fund: 'Postal Life Insurance', target: 4600, icon: '📮' },
  { id: 'rd1', name: 'RD 1', fund: 'Recurring Deposit', target: 1000, icon: '💰' },
  { id: 'rd2', name: 'RD 2', fund: 'Recurring Deposit', target: 1000, icon: '💰' }
]

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Returns 1 or 2 based on the current date (Phase 1: Jul–Dec 2026, Phase 2: Jan 2027+).
export function getCurrentPhase(date = new Date()) {
  const key = monthKey(date)
  return key <= PHASE1.endMonth ? 1 : 2
}

export function getAllocations(phase) {
  return phase === 1 ? PHASE1_ALLOCATIONS : PHASE2_ALLOCATIONS
}
