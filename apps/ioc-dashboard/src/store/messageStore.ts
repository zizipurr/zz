import { create } from 'zustand'
import request from '@/api/request'

interface Message {
  id: number; title: string; content: string
  type: string; isRead: boolean; createdAt: string
}
interface MessageState {
  messages: Message[]
  unreadCount: number
  loading: boolean
  fetchMessages: () => Promise<void>
  fetchUnreadCount: () => Promise<void>
  markRead: (id: number) => Promise<void>
  markAllRead: () => Promise<void>
}

function hasToken() {
  return !!localStorage.getItem('zcy_token')
}

function isUnauthorized(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === 401
  )
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  unreadCount: 0,
  loading: false,
  fetchMessages: async () => {
    if (!hasToken()) {
      set({ messages: [], unreadCount: 0, loading: false })
      return
    }
    set({ loading: true })
    try {
      const { data } = await request.get('/messages')
      const list = Array.isArray(data) ? data : (data?.list ?? [])
      set({ messages: list, loading: false })
    } catch (err) {
      if (isUnauthorized(err)) {
        set({ messages: [], unreadCount: 0, loading: false })
        return
      }
      set({ loading: false })
      throw err
    }
  },
  fetchUnreadCount: async () => {
    if (!hasToken()) {
      set({ unreadCount: 0 })
      return
    }
    try {
      const { data } = await request.get('/messages/unread')
      set({ unreadCount: data.count })
    } catch (err) {
      if (isUnauthorized(err)) {
        set({ unreadCount: 0 })
        return
      }
      throw err
    }
  },
  markRead: async (id) => {
    if (!hasToken()) return
    await request.post(`/messages/${id}/read`)
    const { data } = await request.get('/messages')
    const { data: u } = await request.get('/messages/unread')
    const list = Array.isArray(data) ? data : (data?.list ?? [])
    set({ messages: list, unreadCount: u.count })
  },
  markAllRead: async () => {
    if (!hasToken()) return
    await request.post('/messages/read-all')
    const { data } = await request.get('/messages')
    const list = Array.isArray(data) ? data : (data?.list ?? [])
    set({ messages: list, unreadCount: 0 })
  },
}))
