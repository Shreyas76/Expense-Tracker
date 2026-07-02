import { motion } from 'framer-motion'

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'expenses', label: 'Expenses', icon: '🧾' },
  { id: 'investments', label: 'Invest', icon: '📈' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
]

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="border-t border-white/5 safe-bottom">
      <div className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className="relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 pt-2 active:opacity-70"
            >
              {isActive && (
                <motion.span
                  layoutId="navpill"
                  className="absolute top-1 h-8 w-14 rounded-full bg-primary/15"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
              <span className={`relative text-lg ${isActive ? 'scale-110' : 'opacity-70'} transition`}>
                {tab.icon}
              </span>
              <span
                className={`relative text-[11px] font-medium ${
                  isActive ? 'text-primary' : 'text-muted'
                }`}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
