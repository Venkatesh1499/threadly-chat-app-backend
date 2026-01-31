import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { getPendingConnectionRequests } from '@/services/userRequestService'
import { actionRequest } from '@/services/connectionService'
import type { PendingConnectionRequest } from '@/services/userRequestService'
import { connectSocket } from '@/services/socketService'
import { Button } from '@/components/ui/Button'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import type { ApiError } from '@/lib/api'

export function PendingRequests() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [list, setList] = useState<PendingConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await getPendingConnectionRequests({ user_id: user.id })
      setList(res ?? [])
    } catch (err) {
      const apiErr = err as ApiError
      addToast(apiErr?.message ?? 'Failed to load requests', 'error')
      setList([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, addToast])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  useRetryOnReconnect(fetchPending)

  const handleAction = useCallback(
    async (
      request: PendingConnectionRequest,
      action: 'ACCEPT' | 'REJECT'
    ) => {
      const key = request.id
      setActing(key)
      try {
        const res = await actionRequest({
          connection_id: request.id,
          primary_id: request.primary_id,
          secondary_id: request.secondary_id,
          primary_name: request.primary_name,
          secondary_name: request.secondary_name,
          action,
        })
        setList((prev) => prev.filter((r) => r.id !== key))
        if (action === 'ACCEPT' && 'connection_Id' in res) {
          addToast('Connection accepted! Opening chat.', 'success')
          connectSocket()
          const otherName = request.secondary_id === user?.id ? request.primary_name : request.secondary_name
          navigate(`/chat/${encodeURIComponent(res.connection_Id)}?name=${encodeURIComponent(otherName)}`)
        } else {
          addToast('Request rejected', 'info')
        }
      } catch (err) {
        const apiErr = err as ApiError
        addToast(apiErr?.message ?? 'Action failed', 'error')
      } finally {
        setActing(null)
      }
    },
    [user?.id, addToast, navigate]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Pending requests
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Accept or reject connection requests.
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        )}
        {!loading && list.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No pending requests.
          </motion.p>
        )}
        <AnimatePresence mode="popLayout">
          {!loading &&
            list.map((req) => {
              const isSecondary = req.secondary_id === user?.id
              const fromName = isSecondary ? req.primary_name : req.secondary_name
              return (
                <motion.div
                  key={req.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                      {fromName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="truncate font-medium text-gray-900 dark:text-white">
                      {fromName} wants to connect
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={acting === req.id}
                      disabled={!!acting}
                      onClick={() => handleAction(req, 'REJECT')}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      loading={acting === req.id}
                      disabled={!!acting}
                      onClick={() => handleAction(req, 'ACCEPT')}
                    >
                      Accept
                    </Button>
                  </div>
                </motion.div>
              )
            })}
        </AnimatePresence>
      </div>
    </div>
  )
}
