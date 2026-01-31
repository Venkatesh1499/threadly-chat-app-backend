import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { searchUsers, sendConnectionRequest } from '@/services/userRequestService'
import type { UserSearchResult } from '@/services/userRequestService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { SkeletonListItem } from '@/components/ui/Skeleton'
import type { ApiError } from '@/lib/api'

export function Search() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const q = query.trim()
      if (!q) {
        setResults([])
        setSearched = false
        return
      }
      setLoading(true)
      setSearched(true)
      setResults([])
      try {
        const res = await searchUsers({ search_text: q })
        const list = Array.isArray(res) ? res : []
        // Exclude current user
        setResults(list.filter((u) => u.id !== user?.id))
      } catch (err) {
        const apiErr = err as ApiError
        addToast(apiErr?.message ?? 'Search failed', 'error')
        setResults([])
      } finally {
        setLoading(false)
      }
    },
    [query, user?.id, addToast]
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
        setResults((prev) => prev.filter((u) => u.id !== target.id))
      } catch (err) {
        const apiErr = err as ApiError
        const msg = apiErr?.message ?? apiErr?.error ?? 'Failed to send request'
        addToast(msg, 'error')
      } finally {
        setSending(null)
      }
    },
    [user, addToast]
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Find people
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" loading={loading}>
            Search
          </Button>
        </form>
      </div>
      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {[1, 2, 3].map((i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        )}
        {!loading && searched && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 text-center text-sm text-gray-500 dark:text-gray-400"
          >
            No users found. Try a different search.
          </motion.p>
        )}
        <AnimatePresence mode="popLayout">
          {!loading &&
            results.map((u) => (
              <motion.div
                key={u.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
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
                  onClick={() => handleSendRequest(u)}
                >
                  Add
                </Button>
              </motion.div>
            ))}
        </AnimatePresence>
        {!searched && !loading && (
          <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Enter a username and search to find people.
          </p>
        )}
      </div>
    </div>
  )
}
