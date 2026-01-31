/**
 * Connection management API — accept/reject request, active connections.
 * Endpoints: POST /action-request, POST /active-connections
 */

import { post } from '@/lib/api'

export type ActionType = 'ACCEPT' | 'REJECT'

export interface ActionRequestPayload {
  connection_id?: string | null
  primary_id: string
  secondary_id: string
  primary_name: string
  secondary_name: string
  action: ActionType
}

export interface ActionAcceptResponse {
  connection_Id: string
  message: string
}

export interface ActionRejectResponse {
  message: string
}

/** Accept or reject a connection request. On ACCEPT, returns connection_Id (use as Socket room). */
export async function actionRequest(
  payload: ActionRequestPayload
): Promise<ActionAcceptResponse | ActionRejectResponse> {
  return post<ActionAcceptResponse | ActionRejectResponse>('/action-request', payload)
}

export interface ActiveConnectionsPayload {
  user_id: string
}

export interface ActiveConnection {
  common_id: string
  primary_id: string
  secondary_id: string
  primary_name: string
  secondary_name: string
  created_at?: string
}

/** Fetch active connections for the user (chats). */
export async function getActiveConnections(payload: ActiveConnectionsPayload): Promise<ActiveConnection[]> {
  return post<ActiveConnection[]>('/active-connections', payload)
}
