/**
 * Auth API — connects to backend Auth routes.
 * Endpoints: POST /register, POST /login, GET /users
 */

import { get, post } from '@/lib/api'

export interface RegisterPayload {
  username: string
  password: string
}

export interface RegisterResponse {
  id: string
  username: string
}

export interface LoginPayload {
  username: string
  password: string
}

export interface User {
  id: string
  username: string
}

/** Register a new user. Returns user id and username. */
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  return post<RegisterResponse>('/register', payload)
}

/** Login. Backend returns 200 with message; does not return user id. Use getCurrentUser after login. */
export async function login(payload: LoginPayload): Promise<{ message: string }> {
  return post<{ message: string }>('/login', payload)
}

/** Fetch all users. Used to resolve current user id by username after login. */
export async function getUsers(): Promise<User[]> {
  return get<User[]>('/users')
}

/** Resolve current user by username (call after login; backend does not return user id on login). */
export async function getCurrentUserByUsername(username: string): Promise<User | null> {
  const users = await getUsers()
  return users.find((u) => u.username === username) ?? null
}
