import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useEventStore } from '@/store/eventStore'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import styles from './DispatchModal.module.scss'

interface Props {
  event: { id: number; title: string; location: string; level: string; status: string; district?: string | null }
  onClose: () => void
}

interface StaffUser {
  id: number
  username: string
  realName: string | null
  nickname: string | null
  district: string | null
  tenantId: string | null
}

type TimelineAction = 'created' | 'dispatched' | 'started' | 'completed'
type TimelineItem = { action: TimelineAction; time: string | null; actorName: string | null }
type EventDetail = {
  id: number
  title: string
  location: string
  level: string
  status: string
  district?: string | null
  timeline?: TimelineItem[]
  result?: string | null
}

const LEVEL_LABELS: Record<string, string> = { high: '高危', mid: '中危', low: '低危' }
const STATUS_LABELS: Record<string, string> = { pending: '待处理', doing: '处理中', done: '已完结' }
const TIMELINE_LABELS: Record<TimelineAction, string> = {
  created: '事件上报',
  dispatched: '指挥派单',
  started: '开始处理',
  completed: '处置完结',
}

function formatTimelineTime(input?: string | null) {
  if (!input) return null
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${min}`
}

function staffLabel(u: StaffUser) {
  const name = u.realName || u.nickname || u.username
  return u.district ? `${name}（${u.district}）` : name
}

export default function DispatchModal({ event, onClose }: Props) {
  const [staffList, setStaffList] = useState<StaffUser[]>([])
  const [assignee, setAssignee] = useState('')
  const [remark, setRemark] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<EventDetail | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dispatch = useEventStore(s => s.dispatch)
  const { user, currentTenantId } = useAuthStore()

  // tenantId 仅用于 useEffect 依赖，实际不再手动拼 URL
  // super_admin 的 tenantId 由 request.ts 拦截器自动注入到 query params
  const tenantId = user?.role === 'super_admin' ? currentTenantId : user?.tenantId

  useEffect(() => {
    // 直接调用，tenantId 由 request 拦截器自动处理（super_admin 会加 ?tenantId=...）
    // 非 super_admin 用户的 tenantId 由后端从 JWT 读取，无需前端传
    request.get<StaffUser[]>('/users/staff')
      .then(res => {
        const list = (res.data ?? []) as StaffUser[]
        setStaffList(list)
        if (list.length > 0) setAssignee(list[0].username)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  const fetchDetail = useRef(async () => {})
  fetchDetail.current = async () => {
    try {
      const { data } = await request.get<EventDetail>(`/events/${event.id}`)
      if (data) setDetail(data)
    } catch {
      // ignore detail failure, keep base event info
    }
  }

  useEffect(() => {
    void fetchDetail.current()
  }, [event.id])

  // 点击外部关闭下拉
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function onEventUpdated(e: Event) {
      const detailEvt = e as CustomEvent<{ id?: number }>
      if (Number(detailEvt.detail?.id) !== event.id) return
      void fetchDetail.current()
    }
    window.addEventListener('event_updated_payload', onEventUpdated)
    return () => window.removeEventListener('event_updated_payload', onEventUpdated)
  }, [event.id])

  async function handleDispatch() {
    if (!assignee) return
    await dispatch(event.id, assignee, remark)
    onClose()
  }

  const selected = staffList.find(u => u.username === assignee)
  const selectedDisplay = selected ? staffLabel(selected) : (loading ? '加载中…' : (assignee || '请选择网格员'))

  // 位置展示：优先 district，再 location
  const source = detail ?? event
  const locationDisplay = [source.district, source.location].filter(Boolean).join(' · ') || '—'
  const timeline: TimelineItem[] = source.timeline && source.timeline.length > 0
    ? source.timeline
    : [
        { action: 'created', time: null, actorName: null },
        { action: 'dispatched', time: null, actorName: null },
        { action: 'started', time: null, actorName: null },
        { action: 'completed', time: null, actorName: null },
      ]

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>事件详情 — {source.title}</div>
          <button type="button" className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>位置 / 区域</label>
              <div className={styles.val}>{locationDisplay}</div>
            </div>
            <div className={styles.field}>
              <label>告警等级</label>
              <div className={`${styles.val} ${styles.levelVal} ${styles[source.level]}`}>
                {LEVEL_LABELS[source.level]}
              </div>
            </div>
          </div>
          <div className={styles.field}>
            <label>当前状态</label>
            <div className={styles.val}>{STATUS_LABELS[source.status]}</div>
          </div>
          <div className={styles.field}>
            <label>派单给</label>
            <div className={styles.customSelect} ref={dropdownRef}>
              <div
                className={`${styles.selectTrigger} ${dropdownOpen ? styles.open : ''}`}
                onClick={() => !loading && staffList.length > 0 && setDropdownOpen(v => !v)}
              >
                <span>{selectedDisplay}</span>
                <span className={styles.arrow}>▾</span>
              </div>
              {dropdownOpen && staffList.length > 0 && (
                <div className={styles.dropdown}>
                  {staffList.map(u => (
                    <div
                      key={u.id}
                      className={`${styles.option} ${assignee === u.username ? styles.selected : ''}`}
                      onClick={() => { setAssignee(u.username); setDropdownOpen(false) }}
                    >
                      {staffLabel(u)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={styles.field}>
            <label>备注</label>
            <textarea className={styles.textarea} value={remark} onChange={e => setRemark(e.target.value)} placeholder="输入派单备注…" />
          </div>

          <div className={styles.timelineSection}>
            <div className={styles.timelineTitle}>处置记录</div>
            <div className={styles.timelineList}>
              {timeline.map((node, idx) => {
                const done = !!node.time
                const last = idx === timeline.length - 1
                return (
                  <div key={node.action} className={styles.timelineRow}>
                    <div className={styles.timelineAxis}>
                      <span className={`${styles.timelineDot} ${done ? styles.dotDone : styles.dotPending}`} />
                      {!last && (
                        <span className={`${styles.timelineLine} ${done ? styles.lineDone : styles.linePending}`} />
                      )}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineNodeTitle}>{TIMELINE_LABELS[node.action]}</div>
                      {done ? (
                        <div className={styles.timelineMeta}>
                          <span>{node.actorName || '系统'}</span>
                          <span>{formatTimelineTime(node.time)}</span>
                        </div>
                      ) : (
                        <div className={styles.timelinePending}>待完成</div>
                      )}
                      {node.action === 'completed' && source.result ? (
                        <div className={styles.resultCard}>{source.result}</div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>取消</button>
          <button type="button" className={styles.btnPrimary} onClick={handleDispatch} disabled={!assignee || loading}>确认派单</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
