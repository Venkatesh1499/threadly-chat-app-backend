import { useEffect, useState, useCallback } from 'react'
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRetryOnReconnect } from '@/hooks/useRetryOnReconnect'
import { useLayoutRefresh } from '@/contexts/LayoutRefreshContext'
import { getPendingConnectionRequests } from '@/services/userRequestService'
import { getActiveConnections } from '@/services/connectionService'
import { searchUsers, sendConnectionRequest } from '@/services/userRequestService'
import type { PendingConnectionRequest } from '@/services/userRequestService'
import type { ActiveConnection } from '@/services/connectionService'
import type { UserSearchResult } from '@/services/userRequestService'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import type { ApiError } from '@/lib/api'

type Tab = 'pending' | 'chats' | 'search'

const tabs: { id: Tab; label: string; path: string }[] = [
  { id: 'pending', label: 'Pending', path: '/requests' },
  { id: 'chats', label: 'Chats', path: '/chats' },
  { id: 'search', label: 'Find people', path: '/search' },
]

export function ConversationList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { addToast } = useToast()
  const { registerRefreshPending, registerRefreshChats } = useLayoutRefresh()
  const pathname = location.pathname
  const isRequests = pathname === '/requests'
  const isChats = pathname === '/chats' || pathname.startsWith('/chat/')
  const isSearch = pathname === '/search'

  const [pending, setPending] = useState<PendingConnectionRequest[]>([])
  const [connections, setConnections] = useState<ActiveConnection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchSearched, setSearchSearched] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [pendingLoading, setPendingLoading] = useState(true)
  const [chatsLoading, setChatsLoading] = useState(true)

  const selectedRequestId = searchParams.get('selected')

  const fetchPending = useCallback(async () => {
    if (!user?.id) return
    setPendingLoading(true)
    try {
      const res = await getPendingConnectionRequests({ user_id: user.id })
      setPending(res ?? [])
    } catch (err) {
      const apiErr = err as ApiError
      addToast(apiErr?.message ?? 'Failed to load requests', 'error')
      setPending([])
    } finally {
      setPendingLoading(false)
    }
  }, [user?.id, addToast])

  const fetchChats = useCallback(async () => {
    if (!user?.id) return
    setChatsLoading(true)
    try {
      const res = await getActiveConnections({ user_id: user.id })
      setConnections(res ?? [])
    } catch (err) {
      const apiErr = err as ApiError
      addToast(apiErr?.message ?? 'Failed to load chats', 'error')
      setConnections([])
    } finally {
      setChatsLoading(false)
    }
  }, [user?.id, addToast])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])
  useEffect(() => {
    fetchChats()
  }, [fetchChats])
  useEffect(() => {
    const unregister = registerRefreshPending(fetchPending)
    return unregister
  }, [registerRefreshPending, fetchPending])
  useEffect(() => {
    const unregister = registerRefreshChats(fetchChats)
    return unregister
  }, [registerRefreshChats, fetchChats])
  useRetryOnReconnect(() => {
    fetchPending()
    fetchChats()
  })

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const q = searchQuery.trim()
      if (!q) {
        setSearchResults([])
        setSearchSearched(false)
        return
      }
      setSearchLoading(true)
      setSearchSearched(true)
      setSearchResults([])
      try {
        const res = await searchUsers({ search_text: q })
        const list = Array.isArray(res) ? res : []
        setSearchResults(list.filter((u) => u.id !== user?.id))
      } catch (err) {
        const apiErr = err as ApiError
        addToast(apiErr?.message ?? 'Search failed', 'error')
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    },
    [searchQuery, user?.id, addToast]
  )

  const handleSendRequest = useCallback(
    async (target: UserSearchResult) => {
      if (!user) return
      setSending(target.id)
      try {
        await sendConnectionRequest({
          primary_id: user.id,
          secondary_id: target.id,
          primary_name: user.username,
          secondary_name: target.username,
        })
        addToast(`Request sent to ${target.username}`, 'success')
        setSearchResults((prev) => prev.filter((u) => u.id !== target.id))
      } catch (err) {
        const apiErr = err as ApiError
        addToast(apiErr?.message ?? apiErr?.error ?? 'Failed to send request', 'error')
      } finally {
        setSending(null)
      }
    },
    [user, addToast]
  )

  const getOtherName = (c: ActiveConnection) =>
    c.primary_id === user?.id ? c.secondary_name : c.primary_name

  const getRequestFromName = (req: PendingConnectionRequest) =>
    req.secondary_id === user?.id ? req.primary_name : req.secondary_name

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <NavLink
            key={tab.id}
            to={tab.path}
            end={tab.path === '/requests'}
            className={({ isActive }) => {
              const active = tab.path === '/chats' ? (isActive || pathname.startsWith('/chat/')) : isActive
              return `flex-1 py-3 text-center text-sm font-medium transition-colors ${
                active
                  ? 'border-b-2 border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`
            }}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Search bar on Find people; otherwise "Make friends" entry */}
      <div className="border-b border-gray-200 p-2 dark:border-gray-700">
        {isSearch ? (
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <Button type="submit" size="sm" loading={searchLoading}>
              Search
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/50">
              <svg className="h-4 w-4 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <span>Search or make friends</span>
          </button>
        )}
      </div>

      {/* List content based on current route */}
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {isRequests && (
          <>
            {pendingLoading && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3].map((i) => (
                  <SkeletonListItem key={i} />
                ))}
              </div>
            )}
            {!pendingLoading && pending.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center px-4 py-12 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <svg className="h-8 w-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white">
                  No pending requests
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  When someone sends you a request, it will show here.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/search')}
                >
                  Make friends
                </Button>
              </motion.div>
            )}
            <AnimatePresence mode="popLayout">
              {!pendingLoading &&
                pending.map((req) => {
                  const fromName = getRequestFromName(req)
                  const isSelected = selectedRequestId === req.id
                  return (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors dark:border-gray-700 ${
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSearchParams({ selected: req.id })}
                    >
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                        {fromName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900 dark:text-white">
                          {fromName}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          Wants to connect
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
            </AnimatePresence>
          </>
        )}

        {isChats && (
          <>
            {chatsLoading && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonListItem key={i} />
                ))}
              </div>
            )}
            {!chatsLoading && connections.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center px-4 py-12 text-center"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No chats yet. Accept a request or find people to start.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  size="md"
                  onClick={() => navigate('/search')}
                >
                  Make friends
                </Button>
              </motion.div>
            )}
            <AnimatePresence mode="popLayout">
              {!chatsLoading &&
                connections.map((c) => (
                  <Link
                    key={c.common_id}
                    to={`/chat/${encodeURIComponent(c.common_id)}?name=${encodeURIComponent(getOtherName(c))}`}
                    className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                      {getOtherName(c).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {getOtherName(c)}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        Tap to open chat
                      </p>
                    </div>
                    <svg className="h-5 w-5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
            </AnimatePresence>
          </>
        )}

        {isSearch && (
          <div className="p-2">
            {searchLoading && (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {[1, 2, 3].map((i) => (
                  <SkeletonListItem key={i} />
                ))}
              </div>
            )}
            {!searchLoading && searchSearched && searchResults.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No users found. Try a different search.
              </p>
            )}
            <AnimatePresence mode="popLayout">
              {!searchLoading &&
                searchResults.map((u) => (
                  <motion.div
                    key={u.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-between gap-2 rounded-lg border-b border-gray-100 px-3 py-2 dark:border-gray-700"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate font-medium text-gray-900 dark:text-white">
                        {u.username}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      loading={sending === u.id}
                      disabled={!!sending}
                      onClick={(e) => {
                        e.preventDefault()
                        handleSendRequest(u)
                      }}
                    >
                      Add
                    </Button>
                  </motion.div>
                ))}
            </AnimatePresence>
            {!searchLoading && !searchSearched && (
              <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Use the search bar above to find people.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
