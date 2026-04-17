import { useEffect, useState } from 'react'
import { useKpiStore, type KpiSummary } from '@/store/kpiStore'
import { useAuthStore } from '@/store/authStore'
import styles from './KpiBar.module.scss'

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 60
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target])
  return <span>{val.toLocaleString()}</span>
}

const TENANT_NAMES: Record<string, string> = {
  shenzhen: '深圳市',
  guangzhou: '广州市',
}

const CARDS = [
  { key: 'nodes', label: '监控网格节点', icon: '📡', color: 'cyan', delta: '▲ +12 今日', deltaClass: 'up' },
  { key: 'lights', label: '智能路灯节点', icon: '💡', color: 'cyan', delta: '▲ +4 在线', deltaClass: 'up' },
  { key: 'residents', label: '智慧社区住户', icon: '🏘', color: 'green', delta: '▲ +38 本周', deltaClass: 'up' },
  { key: 'traffic', label: '交通监控接口', icon: '🚦', color: 'cyan', delta: '152 在线', deltaClass: '' },
  { key: 'alerts', label: '应急事件', icon: '⚠️', color: 'red', delta: '实时处置中', deltaClass: 'down' },
]

export default function KpiBar() {
  const kpi = useKpiStore((s) => s.kpi)
  const fetchKpi = useKpiStore((s) => s.fetchKpi)
  const user = useAuthStore((s) => s.user)
  const currentTenantId = useAuthStore((s) => s.currentTenantId)

  // 当前展示的城市标注
  // super_admin 无租户时显示「全局」，有租户时显示城市名
  // 其他角色显示自己归属的城市
  const tenantLabel = (() => {
    if (user?.role === 'super_admin') {
      return currentTenantId ? (TENANT_NAMES[currentTenantId] ?? currentTenantId) : '全局'
    }
    return user?.tenantId ? (TENANT_NAMES[user.tenantId] ?? user.tenantId) : null
  })()

  useEffect(() => {
    fetchKpi()

    function onVisible() {
      if (!document.hidden) fetchKpi()
    }

    window.addEventListener('refresh_events', fetchKpi)
    window.addEventListener('tenant_changed', fetchKpi)
    window.addEventListener('focus', fetchKpi)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('refresh_events', fetchKpi)
      window.removeEventListener('tenant_changed', fetchKpi)
      window.removeEventListener('focus', fetchKpi)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchKpi])

  return (
    <div className={styles.kpiContainer}>
      {CARDS.map(card => (
        <div key={card.key} className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIcon}>{card.icon}</div>
            <div className={styles.kpiLabel}>{card.label}</div>
          </div>
          <div className={`${styles.heroNumber} ${styles[card.color] || ''}`}>
            <AnimatedNumber target={kpi[card.key as keyof KpiSummary] as number ?? 0} />
          </div>
          <div className={styles.kpiFooter}>
            <span className={`${styles.kpiDelta} ${styles[card.deltaClass] || ''}`}>
              {card.delta}
            </span>
            {tenantLabel && (
              <span className={styles.tenantBadge}>{tenantLabel}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
