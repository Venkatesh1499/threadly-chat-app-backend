import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import {
  connectSocket,
  getSocket,
  joinRoom,
  sendRoomMessage,
  onRoomMessage,
} from '@/services/socketService'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { SkeletonChatBubble } from '@/components/ui/Skeleton'

export interface ChatMessage {
  id: string
  text: string
  sent: boolean
  timestamp: number
}

export function ChatRoom() {
  const { connectionId: rawId } = useParams<{ connectionId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToast } = useToast()
  const connectionId = rawId ? decodeURIComponent(rawId) : ''
  const otherName = searchParams.get('name') ?? 'Chat'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [joining, setJoining] = useState(true)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [])

  useEffect(() => {
    if (!connectionId) {
      setJoinError('Invalid chat')
      setJoining(false)
      return
    }
    const socket = connectSocket()
    const onConnect = () => {
      joinRoom(connectionId)
      setJoining(false)
      setJoinError(null)
    }
    const onConnectError = () => {
      setJoinError('Could not connect to chat server')
      setJoining(false)
    }
    if (socket.connected) {
      joinRoom(connectionId)
      setJoining(false)
    } else {
      socket.once('connect', onConnect)
      socket.once('connect_error', onConnectError)
    }
    const unsub = onRoomMessage((payload) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `recv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text: payload.message,
          sent: false,
          timestamp: Date.now(),
        },
      ])
    })
    return () => {
      socket.off('connect', onConnect)
      socket.off('connect_error', onConnectError)
      unsub()
    }
  }, [connectionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = input.trim()
      if (!text || !connectionId || sending) return
      const tempId = `sent-${Date.now()}`
      const newMsg: ChatMessage = {
        id: tempId,
        text,
        sent: true,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, newMsg])
      setInput('')
      setSending(true)
      try {
        sendRoomMessage(connectionId, text)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, id: `sent-${m.timestamp}-${m.text.slice(0, 8)}` } : m
          )
        )
      } catch {
        addToast('Failed to send message', 'error')
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
      } finally {
        setSending(false)
      }
      scrollToBottom()
    },
    [connectionId, input, sending, addToast, scrollToBottom]
  )

  const goBack = useCallback(() => {
    navigate('/chats')
  }, [navigate])

  if (!connectionId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">Invalid chat.</p>
        <Button onClick={goBack}>Back to Chats</Button>
      </div>
    )
  }

  if (joining) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Joining chat…</p>
        <div className="flex flex-col gap-2">
          <SkeletonChatBubble sent={false} />
          <SkeletonChatBubble sent={true} />
        </div>
      </div>
    )
  }

  if (joinError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-red-600 dark:text-red-400">{joinError}</p>
        <Button onClick={goBack}>Back to Chats</Button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      {/* Chat header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
        <button
          type="button"
          onClick={goBack}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Back to chats"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
          {otherName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold text-gray-900 dark:text-white">
            {otherName}
          </h1>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            Online
          </p>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        className="scrollbar-thin flex-1 overflow-y-auto bg-gray-50 px-4 py-4 dark:bg-gray-900"
      >
        <div className="flex flex-col gap-2">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
                    msg.sent
                      ? 'bg-primary-600 text-white dark:bg-primary-500'
                      : 'bg-white text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex shrink-0 gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          disabled={sending}
          maxLength={4000}
        />
        <Button type="submit" size="md" loading={sending} disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
