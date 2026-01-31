import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ConversationList } from './ConversationList'
import { ThemeToggle } from './ThemeToggle'
import { OfflineBanner } from './OfflineBanner'
import { EmptyState } from './EmptyState'
import { RequestDetailWrapper } from './RequestDetailWrapper'
import { ChatRoom } from '@/pages/ChatRoom'
import { useAuth } from '@/contexts/AuthContext'
import { LayoutRefreshProvider } from '@/contexts/LayoutRefreshContext'
import { Button } from '@/components/ui/Button'

function RightPanel() {
  const location = useLocation()
  const params = useParams<{ connectionId?: string }>()
  const [searchParams] = useSearchParams()
  const connectionId = params.connectionId
  const selectedRequestId = searchParams.get('selected')

  if (connectionId) {
    return <ChatRoom />
  }
  if (location.pathname === '/requests' && selectedRequestId) {
    return (
      <RequestDetailWrapper
        selectedRequestId={selectedRequestId}
      />
    )
  }
  if (location.pathname === '/search') {
    return (
      <EmptyState
        title="Find people"
        subtitle="Use the search bar on the left to find users and send connection requests."
        showMakeFriends={false}
      />
    )
  }

  return (
    <EmptyState
      title="Select a conversation"
      subtitle="Choose a request or chat from the list, or find new people to connect with."
      showMakeFriends
    />
  )
}

export function MainLayout() {
  const { user, logout } = useAuth()

  return (
    <LayoutRefreshProvider>
      <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900">
        <OfflineBanner />
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              Threadly
            </span>
            <span className="hidden text-sm text-gray-500 dark:text-gray-400 md:inline">
              {user?.username}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>
        <div className="flex min-h-0 flex-1">
          <ConversationList />
          <main className="min-h-0 flex-1 overflow-hidden">
            <RightPanel />
          </main>
        </div>
      </div>
    </LayoutRefreshProvider>
  )
}
