import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { actionRequest } from '@/services/connectionService'
import { connectSocket } from '@/services/socketService'
import { Button } from '@/components/ui/Button'
import type { PendingConnectionRequest } from '@/services/userRequestService'
import type { ApiError } from '@/lib/api'

interface RequestDetailProps {
  request: PendingConnectionRequest
  onActionDone: () => void
}

export function RequestDetail({ request, onActionDone }: RequestDetailProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [acting, setActing] = useState<'ACCEPT' | 'REJECT' | null>(null)

  const fromName =
    request.secondary_id === user?.id ? request.primary_name : request.secondary_name

  const handleAction = useCallback(
    async (action: 'ACCEPT' | 'REJECT') => {
      setActing(action)
      try {
        const res = await actionRequest({
          connection_id: request.id,
          primary_id: request.primary_id,
          secondary_id: request.secondary_id,
          primary_name: request.primary_name,
          secondary_name: request.secondary_name,
          action,
        })
        onActionDone()
        if (action === 'ACCEPT' && 'connection_Id' in res) {
          addToast('Connection accepted! Opening chat.', 'success')
          connectSocket()
          const otherName =
            request.secondary_id === user?.id ? request.primary_name : request.secondary_name
          navigate(
            `/chat/${encodeURIComponent(res.connection_Id)}?name=${encodeURIComponent(otherName)}`
          )
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
    [request, user?.id, addToast, navigate, onActionDone]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col bg-white dark:bg-gray-800"
    >
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Connection request
        </h2>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
          {fromName.slice(0, 2).toUpperCase()}
        </div>
        <p className="mt-4 text-center text-lg font-medium text-gray-900 dark:text-white">
          {fromName} wants to connect with you
        </p>
        <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
          Accept to start chatting
        </p>
        <div className="mt-8 flex w-full max-w-xs gap-3">
          <Button
            variant="secondary"
            fullWidth
            loading={acting === 'REJECT'}
            disabled={!!acting}
            onClick={() => handleAction('REJECT')}
          >
            Reject
          </Button>
          <Button
            fullWidth
            loading={acting === 'ACCEPT'}
            disabled={!!acting}
            onClick={() => handleAction('ACCEPT')}
          >
            Accept
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
