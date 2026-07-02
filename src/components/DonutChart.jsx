import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { formatCompactINR } from '../utils/formatCurrency'

// Color-coded donut: Fixed / Invested / Spent / Remaining.
// `centerContent` (optional) fully replaces the default label/value in the hole.
export default function DonutChart({ data, centerLabel, centerValue, centerContent }) {
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0)
  const chartData = data.filter((d) => d.value > 0)
  const hasData = total > 0

  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={hasData ? chartData : [{ name: 'empty', value: 1, color: '#232733' }]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={100}
            paddingAngle={hasData ? 2 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {(hasData ? chartData : [{ color: '#232733' }]).map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {centerContent ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto flex w-[132px] flex-col items-center justify-center text-center">
            {centerContent}
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {centerLabel}
          </span>
          <span className="text-2xl font-extrabold text-white">
            {typeof centerValue === 'number' ? formatCompactINR(centerValue) : centerValue}
          </span>
        </div>
      )}
    </div>
  )
}
