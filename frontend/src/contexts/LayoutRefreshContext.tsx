import { createContext, useCallback, useContext, useRef, type ReactNode } from 'react'

type RefreshFn = () => void

interface LayoutRefreshContextValue {
  registerRefreshPending: (fn: RefreshFn) => () => void
  refreshPending: () => void
  registerRefreshChats: (fn: RefreshFn) => () => void
  refreshChats: () => void
}

const LayoutRefreshContext = createContext<LayoutRefreshContextValue | null>(null)

export function LayoutRefreshProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<RefreshFn | null>(null)
  const chatsRef = useRef<RefreshFn | null>(null)

  const registerRefreshPending = useCallback((fn: RefreshFn) => {
    pendingRef.current = fn
    return () => {
      pendingRef.current = null
    }
  }, [])

  const refreshPending = useCallback(() => {
    pendingRef.current?.()
  }, [])

  const registerRefreshChats = useCallback((fn: RefreshFn) => {
    chatsRef.current = fn
    return () => {
      chatsRef.current = null
    }
  }, [])

  const refreshChats = useCallback(() => {
    chatsRef.current?.()
  }, [])

  const value: LayoutRefreshContextValue = {
    registerRefreshPending,
    refreshPending,
    registerRefreshChats,
    refreshChats,
  }

  return (
    <LayoutRefreshContext.Provider value={value}>
      {children}
    </LayoutRefreshContext.Provider>
  )
}

export function useLayoutRefresh() {
  const ctx = useContext(LayoutRefreshContext)
  if (!ctx) return { registerRefreshPending: () => () => {}, refreshPending: () => {}, registerRefreshChats: () => () => {}, refreshChats: () => {} }
  return ctx
}
