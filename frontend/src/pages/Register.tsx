import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { ApiError } from '@/lib/api'

export function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { addToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
    confirmPassword?: string
  }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!username.trim()) next.username = 'Username is required'
    if (!password) next.password = 'Password is required'
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    try {
      await register(username.trim(), password)
      addToast('Account created. Welcome!', 'success')
      navigate('/requests', { replace: true })
    } catch (err) {
      const apiErr = err as ApiError
      const message = apiErr?.message ?? apiErr?.error ?? 'Registration failed'
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
          Create your account
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Join Threadly to start chatting.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            autoComplete="username"
            error={errors.username}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose a password"
            autoComplete="new-password"
            error={errors.password}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            error={errors.confirmPassword}
          />
          <Button type="submit" fullWidth loading={loading} size="lg">
            Sign up
          </Button>
        </form>
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?
          </p>
          <Link to="/login" className="w-full">
            <Button type="button" variant="outline" fullWidth size="lg">
              Log in
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
