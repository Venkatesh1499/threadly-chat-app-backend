/**
 * Socket.IO client — connect to backend, join room by connection_id, send/receive messages.
 * Backend events: join_room({ room }), room_message({ room, message }), server emits room_message({ message })
 */

import { io, Socket } from 'socket.io-client'

const BACKEND_BASE = 'https://threadly-chat-app-backend.onrender.com'

const getSocketUrl = (): string => {
  const url = import.meta.env.VITE_SOCKET_URL
  if (url) return url.replace(/\/$/, '')
  return BACKEND_BASE
}

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket
  const base = getSocketUrl() || (typeof window !== 'undefined' ? window.location.origin : '')
  socket = io(base, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
  })
  return socket
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const SOCKET_EVENTS = {
  JOIN_ROOM: 'join_room',
  ROOM_MESSAGE: 'room_message',
} as const

/** Join chat room using connection_id (required for sending/receiving messages). */
export function joinRoom(connectionId: string): void {
  const s = getSocket()
  if (s?.connected) {
    s.emit(SOCKET_EVENTS.JOIN_ROOM, { room: connectionId })
  }
}

/** Leave room (optional; backend does not implement leave_room in app.py). */
export function leaveRoom(_connectionId: string): void {
  // Backend app.py does not handle leave_room; socket disconnect clears rooms
}

/** Send a message to the room. */
export function sendRoomMessage(connectionId: string, message: string): void {
  const s = getSocket()
  if (s?.connected) {
    s.emit(SOCKET_EVENTS.ROOM_MESSAGE, { room: connectionId, message })
  }
}

/** Subscribe to room_message events (incoming messages). */
export function onRoomMessage(callback: (payload: { message: string }) => void): () => void {
  const s = getSocket()
  if (!s) return () => {}
  s.on(SOCKET_EVENTS.ROOM_MESSAGE, callback)
  return () => {
    s.off(SOCKET_EVENTS.ROOM_MESSAGE, callback)
  }
}
