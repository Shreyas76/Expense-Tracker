import { AnimatePresence, motion } from 'framer-motion'

// Material-style snackbar with optional action (e.g. Undo).
export default function SnackBar({ snack, onAction, onDismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-24">
      <AnimatePresence>
        {snack && (
          <motion.div
            key={snack.id}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 34 }}
            className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-surface-2 px-4 py-3 shadow-2xl ring-1 ring-white/10"
          >
            <span className="flex-1 text-sm text-gray-100">{snack.message}</span>
            {snack.actionLabel && (
              <button
                onClick={() => onAction?.(snack)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-primary active:bg-white/5"
              >
                {snack.actionLabel}
              </button>
            )}
            <button
              onClick={() => onDismiss?.(snack)}
              className="text-muted active:text-white"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
