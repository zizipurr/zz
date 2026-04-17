import { useState, useEffect, useRef } from 'react'
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

const LEVEL_LABELS: Record<string, string> = { high: '高危', mid: '中危', low: '低危' }
const STATUS_LABELS: Record<string, string> = { pending: '待处理', doing: '处理中', done: '已完结' }

function normalizeTenantId(input?: string) {
  if (!input) return undefined
  // 防御：有人误把整个 query 片段塞进来（如 "tenantId=shenzhen&tenantId=shenzhen"）
  const raw = input.includes('tenantId=')
    ? (new URLSearchParams(input.startsWith('?') ? input.slice(1) : input).get('tenantId') || input)
    : input
  const first = raw.split('&')[0]?.split(',')[0]?.trim()
  return first || undefined
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
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dispatch = useEventStore(s => s.dispatch)
  const { user, currentTenantId } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    // super_admin 切换了租户时使用 currentTenantId，否则用自身 tenantId
    const tenantId = user?.role === 'super_admin'
      ? (currentTenantId || undefined)
      : (user?.tenantId || undefined)

    const q = new URLSearchParams()
    const normalized = normalizeTenantId(tenantId)
    if (normalized) q.set('tenantId', normalized) // 只 set 一次，避免重复传参
    const params = q.toString()
    request.get<StaffUser[]>(`/users/staff${params ? `?${params}` : ''}`)
      .then(res => {
        const list = (res.data ?? []) as StaffUser[]
        setStaffList(list)
        if (list.length > 0) setAssignee(list[0].username)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, currentTenantId])

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

  async function handleDispatch() {
    if (!assignee) return
    await dispatch(event.id, assignee, remark)
    onClose()
  }

  const selected = staffList.find(u => u.username === assignee)
  const selectedDisplay = selected ? staffLabel(selected) : (loading ? '加载中…' : (assignee || '请选择网格员'))

  // 位置展示：优先 district，再 location
  const locationDisplay = [event.district, event.location].filter(Boolean).join(' · ') || '—'

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.box} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>事件详情 — {event.title}</div>
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
              <div className={`${styles.val} ${styles.levelVal} ${styles[event.level]}`}>
                {LEVEL_LABELS[event.level]}
              </div>
            </div>
          </div>
          <div className={styles.field}>
            <label>当前状态</label>
            <div className={styles.val}>{STATUS_LABELS[event.status]}</div>
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
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>取消</button>
          <button type="button" className={styles.btnPrimary} onClick={handleDispatch} disabled={!assignee || loading}>确认派单</button>
        </div>
      </div>
    </div>
  )
}
