import { useEffect, useMemo, useState } from 'react'
import styles from './TopBar.module.scss'
import { useTheme } from '../../hooks/useTheme'
import { useEventStore } from '@/store/eventStore'
import TenantSwitcher from '@/components/TenantSwitcher'

export default function TopBar() {
  const [time, setTime] = useState('')
  const { isDark, toggle } = useTheme()
  const events = useEventStore(s => s.events)
  const pendingAlerts = useMemo(() => events?.filter(e => e.status !== 'done').length, [events])

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
        <div className={styles.topbarTitle}>区县级 IOC 驾驶舱</div>
      </div>
      <div className={styles.right}>
        {/* 超级管理员租户切换器，其他角色不渲染 */}
        <TenantSwitcher />

        <span className={styles.weather}>☁ 23°C</span>
        <span className={styles.clock}>{time}</span>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggle}
          title={isDark ? '切换亮色' : '切换暗色'}
          aria-label={isDark ? '切换亮色模式' : '切换暗色模式'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <button
          type="button"
          className={styles.alertBtn}
          onClick={() => window.dispatchEvent(new CustomEvent('open_alert_center'))}
        >
          告警中心
          <span className={styles.alertBadge}>{pendingAlerts}</span>
        </button>
      </div>
    </div>
  )
}
