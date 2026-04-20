import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TopBar from '@/components/TopBar'
import request from '@/api/request'
import styles from './Messages.module.scss'

type MessageType = 'alert' | 'dispatch' | 'complete' | 'system'
type TabType = 'all' | MessageType

type MessageItem = {
  id: number
  title: string
  content: string
  type: MessageType
  isRead: boolean
  createdAt: string
  eventId?: number | null
  relatedEventId?: number | null
  relatedEventTitle?: string | null
}

type UnreadCount = {
  alert: number
  dispatch: number
  complete: number
  system: number
  total: number
}

const PAGE_SIZE = 20

const TAB_DEFS: Array<{ key: TabType; label: string; badgeKey?: MessageType }> = [
  { key: 'all', label: '全部' },
  { key: 'alert', label: '告警', badgeKey: 'alert' },
  { key: 'dispatch', label: '派单通知', badgeKey: 'dispatch' },
  { key: 'complete', label: '完结通知', badgeKey: 'complete' },
  { key: 'system', label: '系统消息', badgeKey: 'system' },
]

const TYPE_COLOR: Record<MessageType, string> = {
  alert: '#ff4d4f',
  dispatch: '#1890ff',
  complete: '#52c41a',
  system: '#8c8c8c',
}

function parseTabType(raw: string | null): TabType {
  if (raw === 'alert' || raw === 'dispatch' || raw === 'complete' || raw === 'system') return raw
  return 'all'
}

function formatMessageTime(input: string) {
  const d = new Date(input)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60000))} 分钟前`
  const sameDay = now.toDateString() === d.toDateString()
  if (sameDay) return `今天 ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
}

function resolveWsUrl() {
  const configured = import.meta.env.VITE_WS_URL as string | undefined
  if (configured) return configured
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (apiBase) {
    try {
      return new URL(apiBase).origin
    } catch {
      // ignore
    }
  }
  return 'http://localhost:3000'
}

export default function MessagesPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>(() => parseTabType(searchParams.get('type')))
  const [list, setList] = useState<MessageItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState<UnreadCount>({
    alert: 0, dispatch: 0, complete: 0, system: 0, total: 0,
  })
  const hasMore = list.length < total
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const loadUnreadCount = useCallback(async () => {
    const { data } = await request.get('/messages/unread-count')
    setUnreadCount({
      alert: Number(data?.alert || 0),
      dispatch: Number(data?.dispatch || 0),
      complete: Number(data?.complete || 0),
      system: Number(data?.system || 0),
      total: Number(data?.total || 0),
    })
  }, [])

  const loadMessages = useCallback(async (targetPage: number, reset = false) => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page: targetPage, pageSize: PAGE_SIZE }
      if (activeTab !== 'all') params.type = activeTab
      const { data } = await request.get('/messages', { params })
      const incoming = (data?.list ?? []) as MessageItem[]
      setTotal(Number(data?.total || 0))
      setList((prev) => {
        if (reset) return incoming
        const seen = new Set(prev.map((x) => x.id))
        return [...prev, ...incoming.filter((x) => !seen.has(x.id))]
      })
      setPage(targetPage)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const loadLatestForCurrentTab = useCallback(async () => {
    const params: Record<string, unknown> = { page: 1, pageSize: 1 }
    if (activeTab !== 'all') params.type = activeTab
    const { data } = await request.get('/messages', { params })
    const top = (data?.list?.[0] ?? null) as MessageItem | null
    if (!top) return
    setList((prev) => (prev.some((x) => x.id === top.id) ? prev : [top, ...prev]))
    setTotal(Number(data?.total || 0))
  }, [activeTab])

  useEffect(() => {
    void loadUnreadCount()
    void loadMessages(1, true)
  }, [activeTab, loadMessages, loadUnreadCount])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      const hit = entries.some((e) => e.isIntersecting)
      if (hit && !loading && hasMore) {
        void loadMessages(page + 1, false)
      }
    }, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadMessages, loading, page])

  const markOneRead = useCallback(async (msg: MessageItem) => {
    if (msg.isRead) return
    await request.patch('/messages/read', { ids: [msg.id] })
    setList((prev) => prev.map((x) => (x.id === msg.id ? { ...x, isRead: true } : x)))
    setUnreadCount((prev) => {
      const next = { ...prev }
      const key = msg.type
      next[key] = Math.max(0, next[key] - 1)
      next.total = Math.max(0, next.total - 1)
      return next
    })
  }, [])

  const markAllRead = useCallback(async () => {
    await request.patch('/messages/read', { ids: [] })
    setList((prev) => prev.map((x) => ({ ...x, isRead: true })))
    setUnreadCount({ alert: 0, dispatch: 0, complete: 0, system: 0, total: 0 })
  }, [])

  const openRelatedEvent = useCallback(async (msg: MessageItem) => {
    await markOneRead(msg)
    const eventId = msg.relatedEventId ?? msg.eventId
    if (!eventId) return
    navigate('/dashboard', { state: { openEventId: eventId } })
  }, [markOneRead, navigate])

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
    })
    socketRef.current = socket
    socket.on('new_message', (payload?: { type?: MessageType }) => {
      const t = payload?.type
      if (t === 'alert' || t === 'dispatch' || t === 'complete' || t === 'system') {
        setUnreadCount((prev) => ({
          ...prev,
          [t]: prev[t] + 1,
          total: prev.total + 1,
        }))
      } else {
        void loadUnreadCount()
      }
      if (!t || activeTab === 'all' || activeTab === t) {
        void loadLatestForCurrentTab()
      }
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [activeTab, loadLatestForCurrentTab, loadUnreadCount])

  const tabBadges = useMemo(() => unreadCount, [unreadCount])

  useEffect(() => {
    const t = parseTabType(searchParams.get('type'))
    setActiveTab((prev) => (prev === t ? prev : t))
  }, [searchParams])

  const changeTab = useCallback((tab: TabType) => {
    setActiveTab(tab)
    if (tab === 'all') {
      setSearchParams({}, { replace: true })
    } else {
      setSearchParams({ type: tab }, { replace: true })
    }
  }, [setSearchParams])

  return (
    <div className={styles.page}>
      <TopBar
        title="消息中心"
        backLabel="← 返回驾驶舱"
        onBack={() => navigate('/dashboard')}
        actionLabel="消息总数"
        actionBadge={tabBadges.total}
        onAction={() => {}}
      />

      <div className={styles.body}>
        <div className={styles.tabs}>
          {TAB_DEFS.map((tab) => {
            const badge = tab.badgeKey ? tabBadges[tab.badgeKey] : 0
            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => changeTab(tab.key)}
              >
                {tab.label}
                {badge > 0 && <span className={styles.badge}>{badge}</span>}
              </button>
            )
          })}
          <div className={styles.tabActions}>
            <button type="button" className={styles.markAllBtn} onClick={() => void markAllRead()}>
              全部标记已读
            </button>
          </div>
        </div>

        <div className={styles.listWrap}>
          {list.map((msg) => {
            const relatedTitle = msg.relatedEventTitle || (msg.relatedEventId || msg.eventId ? `关联事件 #${msg.relatedEventId ?? msg.eventId}` : null)
            return (
              <div key={msg.id} className={styles.card} onClick={() => void markOneRead(msg)}>
                <div className={styles.colorBar} style={{ background: TYPE_COLOR[msg.type] }} />
                <div className={styles.content}>
                  <div className={`${styles.mainText} ${!msg.isRead ? styles.unreadText : ''}`}>{msg.content}</div>
                  {relatedTitle && (
                    <button type="button" className={styles.relatedBtn} onClick={(e) => { e.stopPropagation(); void openRelatedEvent(msg) }}>
                      {relatedTitle}
                    </button>
                  )}
                </div>
                <div className={styles.meta}>
                  <div className={styles.time}>{formatMessageTime(msg.createdAt)}</div>
                  {!msg.isRead && <span className={styles.unreadDot} />}
                </div>
              </div>
            )
          })}

          {!loading && list.length === 0 && <div className={styles.empty}>暂无消息</div>}
          <div ref={sentinelRef} className={styles.sentinel}>{loading ? '加载中...' : hasMore ? '上拉加载更多' : '没有更多了'}</div>
        </div>
      </div>
    </div>
  )
}

