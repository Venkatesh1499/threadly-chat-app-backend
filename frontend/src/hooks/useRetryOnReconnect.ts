import { useEffect, useRef } from 'react'
import { useOffline } from '@/contexts/OfflineContext'

/**
 * Call the given callback when the app comes back online.
 * Use for refetching data (e.g. chats, pending requests) after connection is restored.
 */
export function useRetryOnReconnect(callback: () => void | Promise<void>) {
  const { isOnline } = useOffline()
  const wasOffline = useRef(false)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true
      return
    }
    if (wasOffline.current) {
      wasOffline.current = false
      void Promise.resolve(callbackRef.current())
    }
  }, [isOnline])
}
