import { getCategory } from '../constants/categories'
import { formatTimestamp } from './dateHelpers'

function escapeCsv(value) {
  const s = String(value ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function rowsToCsv(rows) {
  return rows.map((r) => r.map(escapeCsv).join(',')).join('\n')
}

// Builds a combined CSV of month-wise expenses + investments + card payments.
export function buildCsv(data) {
  const months = data.months || {}
  const banks = data.banks || []
  const cards = data.cards || []

  const sourceLabel = (source) => {
    if (!source) return ''
    if (source.type === 'bank') return banks.find((b) => b.id === source.id)?.label || 'Bank'
    if (source.type === 'card') return cards.find((c) => c.id === source.id)?.name || 'Card'
    return ''
  }

  const lines = []
  lines.push(['Type', 'Month', 'Date', 'Category/Bucket', 'Amount', 'Paid with / From', 'Note'])

  Object.keys(months)
    .sort()
    .forEach((mk) => {
      const m = months[mk]
      ;(m.fixed || []).forEach((f) => {
        lines.push(['Fixed', mk, '', f.label, f.amount, sourceLabel(f.source), ''])
      })
      ;(m.expenses || []).forEach((e) => {
        lines.push([
          'Expense',
          mk,
          formatTimestamp(e.ts),
          getCategory(e.category).label,
          e.amount,
          sourceLabel(e.source),
          e.note || ''
        ])
      })
      ;(m.investments || []).forEach((inv) => {
        lines.push([
          'Investment',
          mk,
          formatTimestamp(inv.ts),
          inv.bucketName || inv.bucketId,
          inv.amount,
          '',
          inv.note || ''
        ])
      })
      ;(m.payments || []).forEach((p) => {
        const card = cards.find((c) => c.id === p.cardId)?.name || p.cardId
        const bank = banks.find((b) => b.id === p.bankId)?.label || p.bankId
        lines.push(['Card Payment', mk, formatTimestamp(p.ts), card, p.amount, bank, ''])
      })
    })

  return rowsToCsv(lines)
}

export function downloadCsv(csv, filename = 'tracker-export.csv') {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
