import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { MainLayout } from '@/components/layout/MainLayout'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Spinner } from '@/components/ui/Spinner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth()
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    )
  }
  if (!isAuthenticated) {
    return <Navigate to="/register" replace />
  }
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isInitialized } = useAuth()
  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Spinner size="lg" />
      </div>
    )
  }
  if (isAuthenticated) {
    return <Navigate to="/requests" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/requests" replace />} />
        <Route path="requests" element={null} />
        <Route path="chats" element={null} />
        <Route path="search" element={null} />
        <Route path="chat/:connectionId" element={null} />
      </Route>
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}
