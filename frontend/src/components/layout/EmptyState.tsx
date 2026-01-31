import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  title?: string
  subtitle?: string
  showMakeFriends?: boolean
}

export function EmptyState({
  title = 'Select a conversation',
  subtitle = 'Choose a request or chat from the list, or find new people to connect with.',
  showMakeFriends = true,
}: EmptyStateProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-full flex-col items-center justify-center bg-gray-50 px-6 dark:bg-gray-900"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <svg
          className="h-10 w-10 text-gray-500 dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>
      {showMakeFriends && (
        <Button
          className="mt-6"
          variant="outline"
          size="lg"
          onClick={() => navigate('/search')}
        >
          Make friends
        </Button>
      )}
    </motion.div>
  )
}
