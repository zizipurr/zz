import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Radio, Lightbulb, Building2, TrafficCone, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useKpiStore, type KpiSummary } from '@/store/kpiStore'
import { useAuthStore } from '@/store/authStore'
import type { SceneKpi } from '@/config/sceneConfig'
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

type CardDef = { key: string; label: string; icon: ReactNode; color: string; delta: string; deltaClass: string }

const CARDS: CardDef[] = [
  { key: 'nodes', label: '监控网格节点', icon: <Radio size={18} strokeWidth={1.5} />, color: 'cyan', delta: '▲ +12 今日', deltaClass: 'up' },
  { key: 'lights', label: '智能路灯节点', icon: <Lightbulb size={18} strokeWidth={1.5} />, color: 'cyan', delta: '▲ +4 在线', deltaClass: 'up' },
  { key: 'residents', label: '智慧社区住户', icon: <Building2 size={18} strokeWidth={1.5} />, color: 'green', delta: '▲ +38 本周', deltaClass: 'up' },
  { key: 'traffic', label: '交通监控接口', icon: <TrafficCone size={18} strokeWidth={1.5} />, color: 'cyan', delta: '152 在线', deltaClass: '' },
  { key: 'alerts', label: '应急事件', icon: <AlertTriangle size={18} strokeWidth={1.5} />, color: 'red', delta: '实时处置中', deltaClass: 'down' },
]

function parseNumeric(val: string) {
  const n = Number(String(val).replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function trendClass(text?: string) {
  if (!text) return ''
  if (text.includes('+') || text.includes('在线') || text.includes('优秀')) return 'up'
  if (text.includes('预警') || text.includes('超时') || text.includes('异常')) return 'down'
  return ''
}

type Props = {
  kpis?: SceneKpi[]
}

export default function KpiBar({ kpis }: Props) {
  const kpi = useKpiStore((s) => s.kpi)
  const fetchKpi = useKpiStore((s) => s.fetchKpi)
  const user = useAuthStore((s) => s.user)
  const currentTenantId = useAuthStore((s) => s.currentTenantId)
  const navigate = useNavigate()

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
    // 若用 sceneConfig 渲染 KPI（演示优先），不强依赖后端 KPI 接口
    if (!kpis) fetchKpi()

    const onRefresh = () => { void fetchKpi() }

    function onVisible() {
      if (!document.hidden) fetchKpi()
    }

    window.addEventListener('refresh_events', onRefresh)
    window.addEventListener('tenant_changed', onRefresh)
    window.addEventListener('focus', onRefresh)
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('refresh_events', onRefresh)
      window.removeEventListener('tenant_changed', onRefresh)
      window.removeEventListener('focus', onRefresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchKpi, kpis])

  const viewKpis = useMemo(() => kpis ?? null, [kpis])

  return (
    <div className={styles.kpiContainer}>
      {viewKpis
        ? viewKpis.map((row) => (
        <div
          key={row.label}
          className={styles.kpiCard}
          role="button"
          tabIndex={0}
          title="点击进入对应场景大屏"
          onClick={() => {
            // 用 label 粗映射到场景，保证演示时顺手可点
            const text = row.label
            if (/社区|住户|报修|物业/.test(text)) navigate('/community')
            else if (/应急|告警|处置|响应/.test(text)) navigate('/emergency')
            else if (/交通|路口|拥堵|停车|流量/.test(text)) navigate('/traffic')
            else if (/办件|缴费|热线|民生|服务/.test(text)) navigate('/service')
            else navigate('/dashboard')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const text = row.label
              if (/社区|住户|报修|物业/.test(text)) navigate('/community')
              else if (/应急|告警|处置|响应/.test(text)) navigate('/emergency')
              else if (/交通|路口|拥堵|停车|流量/.test(text)) navigate('/traffic')
              else if (/办件|缴费|热线|民生|服务/.test(text)) navigate('/service')
              else navigate('/dashboard')
            }
          }}
        >
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${row.alert ? styles.kpiIcon_red : ''}`}>
              {row.alert ? <AlertTriangle size={18} strokeWidth={1.5} /> : <Radio size={18} strokeWidth={1.5} />}
            </div>
            <div className={styles.kpiLabel}>{row.label}</div>
            {row.alert ? <span className={styles.statusBadge}>重点</span> : null}
          </div>
          <div className={`${styles.heroNumber} ${row.alert ? styles.red : ''}`}>
            <AnimatedNumber target={parseNumeric(row.value)} />
            {row.unit ? <span className={styles.unit}>{row.unit}</span> : null}
          </div>
          <div className={styles.kpiFooter}>
            <span className={`${styles.kpiDelta} ${styles[trendClass(row.trend)] || ''}`}>{row.trend}</span>
            {tenantLabel && (
              <span className={styles.tenantBadge}>{tenantLabel}</span>
            )}
          </div>
        </div>
      ))
        : CARDS.map(card => (
        <div
          key={card.key}
          className={styles.kpiCard}
          role="button"
          tabIndex={0}
          title="点击进入对应场景大屏"
          onClick={() => {
            const routeMap: Record<string, string> = {
              residents: '/community',
              alerts: '/emergency',
              traffic: '/traffic',
              nodes: '/dashboard',
              lights: '/traffic',
            }
            navigate(routeMap[card.key] ?? '/dashboard')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const routeMap: Record<string, string> = {
                residents: '/community',
                alerts: '/emergency',
                traffic: '/traffic',
                nodes: '/dashboard',
                lights: '/traffic',
              }
              navigate(routeMap[card.key] ?? '/dashboard')
            }
          }}
        >
          <div className={styles.kpiHeader}>
            <div className={`${styles.kpiIcon} ${styles[`kpiIcon_${card.color}`] || ''}`}>{card.icon}</div>
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
