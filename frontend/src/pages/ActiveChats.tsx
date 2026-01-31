import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useRetryOnReconnect } from '@/hooks/useRetryOnReconnect'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getActiveConnections } from '@/services/connectionService'
import type { ActiveConnection } from '@/services/connectionService'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import type { ApiError } from '@/lib/api'

export function ActiveChats() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [connections, setConnections] = useState<ActiveConnection[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConnections = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await getActiveConnections({ user_id: user.id })
      setConnections(res ?? [])
    } catch (err) {
      const apiErr = err as ApiError
      addToast(apiErr?.message ?? 'Failed to load chats', 'error')
      setConnections([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, addToast])

  useEffect(() => {
    fetchConnections()
  }, [fetchConnections])

  useRetryOnReconnect(fetchConnections)

  const getOtherName = (c: ActiveConnection) =>
    c.primary_id === user?.id ? c.secondary_name : c.primary_name

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chats
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Your active conversations.
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        )}
        {!loading && connections.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No chats yet. Search for people and send a connection request, or accept one.
          </motion.p>
        )}
        <AnimatePresence mode="popLayout">
          {!loading &&
            connections.map((c) => (
              <motion.div
                key={c.common_id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Link
                  to={`/chat/${encodeURIComponent(c.common_id)}?name=${encodeURIComponent(getOtherName(c))}`}
                  className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                >
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-base font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                    {getOtherName(c).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900 dark:text-white">
                      {getOtherName(c)}
                    </span>
                    <span className="block truncate text-sm text-gray-500 dark:text-gray-400">
                      Tap to open chat
                    </span>
                  </div>
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
