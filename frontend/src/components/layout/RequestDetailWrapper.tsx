import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useLayoutRefresh } from '@/contexts/LayoutRefreshContext'
import { getPendingConnectionRequests } from '@/services/userRequestService'
import type { PendingConnectionRequest } from '@/services/userRequestService'
import { RequestDetail } from './RequestDetail'
import { Spinner } from '@/components/ui/Spinner'
import type { ApiError } from '@/lib/api'

interface RequestDetailWrapperProps {
  selectedRequestId: string | null
}

export function RequestDetailWrapper({
  selectedRequestId,
}: RequestDetailWrapperProps) {
  const { refreshPending } = useLayoutRefresh()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [pending, setPending] = useState<PendingConnectionRequest[]>([])
  const [loading, setLoading] = useState(!!selectedRequestId)

  const fetchPending = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const res = await getPendingConnectionRequests({ user_id: user.id })
      setPending(res ?? [])
    } catch (err) {
      const apiErr = err as ApiError
      addToast(apiErr?.message ?? 'Failed to load', 'error')
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, addToast])

  useEffect(() => {
    if (selectedRequestId) {
      fetchPending()
    } else {
      setPending([])
      setLoading(false)
    }
  }, [selectedRequestId, fetchPending])

  const request = selectedRequestId
    ? pending.find((r) => r.id === selectedRequestId)
    : null

  if (!selectedRequestId) return null
  if (loading || !request) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-gray-800">
        <Spinner size="lg" />
      </div>
    )
  }

  const onActionDone = useCallback(() => {
    refreshPending()
    setSearchParams({})
  }, [refreshPending, setSearchParams])

  return <RequestDetail request={request} onActionDone={onActionDone} />
}
