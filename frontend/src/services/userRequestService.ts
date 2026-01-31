/**
 * User requests API — search, send connection request, fetch pending.
 * Endpoints: POST /search, POST /connection-request, POST /pending-connection-requests
 */

import { post } from '@/lib/api'

export interface SearchPayload {
  search_text: string
}

export interface UserSearchResult {
  id: string
  username: string
}

/** Search users by username (ILIKE prefix). Returns list or message. */
export async function searchUsers(payload: SearchPayload): Promise<UserSearchResult[] | { message: string }> {
  const res = await post<UserSearchResult[] | { message: string }>('/search', payload)
  if (Array.isArray(res)) return res
  return res
}

export interface SendConnectionRequestPayload {
  primary_id: string
  secondary_id: string
  primary_name: string
  secondary_name: string
}

/** Send a connection request. Returns message or 409 if already sent. */
export async function sendConnectionRequest(payload: SendConnectionRequestPayload): Promise<{ message: string }> {
  return post<{ message: string }>('/connection-request', payload)
}

export interface PendingRequestPayload {
  user_id: string
}

export interface PendingConnectionRequest {
  id: string
  primary_id: string
  secondary_id: string
  primary_name: string
  secondary_name: string
  created_at?: string
}

/** Fetch pending connection requests for the logged-in user. */
export async function getPendingConnectionRequests(payload: PendingRequestPayload): Promise<PendingConnectionRequest[]> {
  return post<PendingConnectionRequest[]>('/pending-connection-requests', payload)
}
