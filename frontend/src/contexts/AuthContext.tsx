import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authService from '@/services/authService'
import { connectSocket, disconnectSocket } from '@/services/socketService'

const STORAGE_KEY = 'threadly-user'

export interface AuthUser {
  id: string
  username: string
}

interface AuthContextValue {
  user: AuthUser | null
  isInitialized: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthUser
    return parsed.id && parsed.username ? parsed : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser)
  const [isInitialized, setIsInitialized] = useState(false)

  const persistUser = useCallback((u: AuthUser | null) => {
    setUser(u)
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const refreshUser = useCallback(async () => {
    const current = loadStoredUser()
    if (!current?.username) return
    try {
      const resolved = await authService.getCurrentUserByUsername(current.username)
      if (resolved) {
        const next: AuthUser = { id: resolved.id, username: resolved.username }
        persistUser(next)
      }
    } catch {
      // Keep existing user on error
    }
  }, [persistUser])

  useEffect(() => {
    const stored = loadStoredUser()
    if (stored?.username) {
      authService.getCurrentUserByUsername(stored.username).then((resolved) => {
        if (resolved) {
          persistUser({ id: resolved.id, username: resolved.username })
        }
        setIsInitialized(true)
      }).catch(() => {
        setIsInitialized(true)
      })
    } else {
      setIsInitialized(true)
    }
  }, [persistUser])

  const login = useCallback(
    async (username: string, password: string) => {
      await authService.login({ username, password })
      const resolved = await authService.getCurrentUserByUsername(username)
      if (!resolved) throw new Error('Could not load user after login')
      const u: AuthUser = { id: resolved.id, username: resolved.username }
      persistUser(u)
      connectSocket()
    },
    [persistUser]
  )

  const register = useCallback(
    async (username: string, password: string) => {
      const res = await authService.register({ username, password })
      const u: AuthUser = { id: res.id, username: res.username }
      persistUser(u)
      connectSocket()
    },
    [persistUser]
  )

  const logout = useCallback(() => {
    persistUser(null)
    disconnectSocket()
  }, [persistUser])

  const value = useMemo(
    () => ({
      user,
      isInitialized,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isInitialized, login, register, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
