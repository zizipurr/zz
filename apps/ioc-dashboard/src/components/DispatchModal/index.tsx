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
  const [dispatchError, setDispatchError] = useState<string | null>(null)
  const [detail, setDetail] = useState<EventDetail | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const dispatch = useEventStore(s => s.dispatch)
  const { user, currentTenantId } = useAuthStore()

  const tenantId = user?.role === 'super_admin' ? currentTenantId : user?.tenantId

  useEffect(() => {
    setLoading(true)
    request.get<StaffUser[]>('/users/staff')
      .then(res => {
        const list = (res.data ?? []) as StaffUser[]
        setStaffList(list)
        if (list.length > 0) setAssignee(list[0].username)
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  useEffect(() => {
    let cancelled = false
    request.get<EventDetail>(`/events/${event.id}`)
      .then(({ data }) => { if (!cancelled && data) setDetail(data) })
      .catch(err => console.error('Failed to fetch event details', err))
    return () => { cancelled = true }
  }, [event.id])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleDispatch() {
    if (!assignee) return
    setDispatchError(null)
    try {
      await dispatch(event.id, assignee, remark)
      onClose()
    } catch (err) {
      console.error('Dispatch failed', err)
      setDispatchError('派单失败，请重试')
    }
  }

  const selected = staffList.find(u => u.username === assignee)
  const selectedDisplay = selected ? staffLabel(selected) : (loading ? '加载中…' : '请选择网格员')

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

          {source.status === 'pending' && (
            <>
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
                  {dropdownOpen && (
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
                <label>派单备注</label>
                <textarea 
                  className={styles.textarea} 
                  value={remark} 
                  onChange={e => setRemark(e.target.value)} 
                  placeholder="输入派单备注内容…" 
                />
              </div>
            </>
          )}

          {/* 优化后的横向流程轴 */}
          <div className={styles.timelineSection}>
            <div className={styles.timelineTitle}>处置记录</div>
            <div className={styles.timelineList}>
              {timeline.map((node, idx) => {
                const done = !!node.time
                const isLast = idx === timeline.length - 1
                return (
                  <div key={node.action} className={styles.timelineRow}>
                    <div className={styles.timelineAxis}>
                      <span className={`${styles.timelineDot} ${done ? styles.dotDone : styles.dotPending}`} />
                      {!isLast && (
                        <span className={`${styles.timelineLine} ${done ? styles.lineDone : styles.linePending}`} />
                      )}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineNodeTitle}>{TIMELINE_LABELS[node.action]}</div>
                      {done ? (
                        <div className={styles.timelineMeta}>
                          <span className={styles.actor}>{node.actorName || '系统'}</span>
                          <span className={styles.time}>{formatTimelineTime(node.time)}</span>
                        </div>
                      ) : (
                        <div className={styles.timelinePending}>待完成</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {source.status === 'done' && source.result && (
              <div className={styles.resultSection}>
                <label>处置结果</label>
                <div className={styles.resultCard}>{source.result}</div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          {dispatchError && <span className={styles.errorMsg}>{dispatchError}</span>}
          <button type="button" className={styles.btnGhost} onClick={onClose}>取消</button>
          {source.status === 'pending' && (
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={handleDispatch}
              disabled={!assignee || loading}
            >
              确认派单
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}