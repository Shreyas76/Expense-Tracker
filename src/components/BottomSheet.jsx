import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'

// Reusable Material-style bottom sheet with drag-to-dismiss and scrim.
export default function BottomSheet({ open, onClose, title, children }) {
  // Lock body scroll while open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-hidden rounded-t-3xl bg-surface shadow-2xl ring-1 ring-white/10"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose?.()
            }}
          >
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-10 rounded-full bg-white/20" />
            </div>
            {title && (
              <div className="px-5 pb-2 pt-3">
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
            )}
            <div className="no-scrollbar max-h-[80vh] overflow-y-auto px-5 pb-8 safe-bottom">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
