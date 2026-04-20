import { useEffect, useMemo, useState } from 'react'
import { Cloud, Sun, Moon } from 'lucide-react'
import styles from './TopBar.module.scss'
import { useTheme } from '../../hooks/useTheme'
import { useEventStore } from '@/store/eventStore'
import TenantSwitcher from '@/components/TenantSwitcher'

type Props = {
  title?: string
  backLabel?: string
  onBack?: () => void
  actionLabel?: string
  actionBadge?: number
  onAction?: () => void
}

export default function TopBar({
  title = '区县级 IOC 驾驶舱',
  backLabel,
  onBack,
  actionLabel = '告警中心',
  actionBadge,
  onAction,
}: Props) {
  const [time, setTime] = useState('')
  const { isDark, toggle } = useTheme()
  const events = useEventStore(s => s.events)
  const pendingAlerts = useMemo(() => events?.filter(e => e.status !== 'done').length, [events])
  const badgeValue = actionBadge ?? pendingAlerts

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString('zh-CN', { hour12: false }))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={styles.topbar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>Z</div>
          <div className={styles.logoText}>智城云</div>
        </div>
        <div className={styles.topbarTitle}>{title}</div>
        {backLabel && onBack && (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            {backLabel}
          </button>
        )}
      </div>
      <div className={styles.right}>
        {/* 超级管理员租户切换器，其他角色不渲染 */}
        <TenantSwitcher />

        <span className={styles.weather}><Cloud size={13} strokeWidth={1.5} /> 23°C</span>
        <span className={styles.clock}>{time}</span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggle}
          title={isDark ? '切换亮色' : '切换暗色'}
          aria-label={isDark ? '切换亮色模式' : '切换暗色模式'}
        >
          {isDark ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
        </button>

        <button
          type="button"
          className={styles.alertBtn}
          onClick={onAction ?? (() => window.dispatchEvent(new CustomEvent('open_alert_center')))}
        >
          {actionLabel}
          {badgeValue > 0 && <span className={styles.alertBadge}>{badgeValue}</span>}
        </button>
      </div>
    </div>
  )
}
