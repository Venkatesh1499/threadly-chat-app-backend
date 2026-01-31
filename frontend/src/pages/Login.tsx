import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { ApiError } from '@/lib/api'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: { username?: string; password?: string } = {}
    if (!username.trim()) next.username = 'Username is required'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      await login(username.trim(), password)
      addToast('Welcome back!', 'success')
      navigate('/chats', { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      const message = apiErr?.message ?? apiErr?.error ?? 'Login failed'
      addToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800"
      >
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Sign in to Threadly
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Enter your credentials to continue.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            autoComplete="username"
            error={errors.username}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            error={errors.password}
          />
          <Button type="submit" fullWidth loading={loading} size="lg">
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-medium text-primary-600 hover:underline dark:text-primary-400"
          >
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
