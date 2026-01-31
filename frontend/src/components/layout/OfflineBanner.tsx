import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '@/contexts/OfflineContext'

export function OfflineBanner() {
  const { isOnline } = useOffline()

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white dark:bg-amber-600"
          role="status"
          aria-live="polite"
        >
          You're offline. Some features may be unavailable. We'll retry when you're back online.
        </motion.div>
      )}
    </AnimatePresence>
  )
}
