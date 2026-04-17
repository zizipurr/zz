import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useMessageStore } from '@/store/messageStore'

function resolveWsUrl() {
  const configured = import.meta.env.VITE_WS_URL as string | undefined
  if (configured) return configured

  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (apiBase) {
    try {
      return new URL(apiBase).origin
    } catch {
      // ignore invalid env value and fallback below
    }
  }

  return 'http://localhost:3000'
}

export function useSocket() {
  const [toastVisible, setToastVisible] = useState(false)
  const fetchUnreadCount = useMessageStore(s => s.fetchUnreadCount)
  const fetchRef = useRef(fetchUnreadCount)

  useEffect(() => {
    fetchRef.current = fetchUnreadCount
  }, [fetchUnreadCount])

  useEffect(() => {
    const token = localStorage.getItem('zcy_token')
    const wsUrl = resolveWsUrl()
    const wsPath = (import.meta.env.VITE_WS_PATH as string) || '/socket.io'

    const socket = io(wsUrl, {
      path: wsPath,
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
      // 重连后立刻派一次刷新，补回断线期间可能漏掉的更新
      window.dispatchEvent(new CustomEvent('refresh_events'))
    })

    socket.on('new_message', () => {
      fetchRef.current()
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3000)
    })

    socket.on('event_updated', () => {
      window.dispatchEvent(new CustomEvent('refresh_events'))
    })

    return () => { socket.disconnect() }
  }, [])

  return { toastVisible }
}