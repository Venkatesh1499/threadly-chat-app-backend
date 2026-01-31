import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'
import { OfflineBanner } from './OfflineBanner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function MainLayout() {
  const { user, logout } = useAuth()

  return (
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
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
