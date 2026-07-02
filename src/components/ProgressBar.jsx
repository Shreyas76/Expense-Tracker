import { motion } from 'framer-motion'

// Animated progress bar. `pct` is 0-100.
export default function ProgressBar({ pct = 0, color = '#6366f1', height = 8, className = '' }) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-white/10 ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  )
}
