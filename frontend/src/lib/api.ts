const BACKEND_BASE = 'https://threadly-chat-app-backend.onrender.com'

/**
 * API base URL. Defaults to Render backend; override with VITE_API_URL (e.g. /api for Vite proxy in dev).
 */
const getBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return `${BACKEND_BASE}/api`
}

export const apiBase = getBaseUrl()

export interface ApiError {
  message: string
  status?: number
  error?: string
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const pathStr = path.startsWith('/') ? path : `/${path}`
  const url = `${apiBase}${pathStr}`
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  let data: unknown
  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const err: ApiError = {
      message: typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: string }).error)
        : typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message: string }).message)
          : res.statusText || 'Request failed',
      status: res.status,
    }
    throw err
  }

  return data as T
}

export async function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' })
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
