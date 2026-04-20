import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import request from '@/api/request'
import styles from './DemoConsole.module.scss'

/** 与后端 MOCK_EVENTS 对应的事件模板 */
const EVENT_TEMPLATES = [
  { title: '排水管网溢出预警', level: 'high' },
  { title: '社区入侵警报', level: 'high' },
  { title: '路灯故障', level: 'mid' },
  { title: '交通信号灯异常', level: 'mid' },
  { title: '垃圾桶满载告警', level: 'low' },
  { title: '消防通道占用', level: 'high' },
  { title: '电梯故障告警', level: 'mid' },
  { title: '噪音扰民投诉', level: 'low' },
]

const SCENE_TEMPLATES = [
  { scene: 'community', title: '社区井盖破损待处置', level: 'mid', location: '南山区-粤海街道-科技园社区' },
  { scene: 'emergency', title: '燃气泄漏应急处置', level: 'high', location: '福田区-福华路-会展中心站口' },
  { scene: 'traffic', title: '高峰拥堵优化工单', level: 'low', location: '罗湖区-深南东路-文锦路口' },
  { scene: 'service', title: '便民事项超时预警', level: 'mid', location: '宝安区-新安街道-政务服务大厅' },
] as const

const SCENE_LABELS: Record<(typeof SCENE_TEMPLATES)[number]['scene'], string> = {
  community: '智慧社区',
  emergency: '城安应急',
  traffic: '智慧交通',
  service: '城市服务',
}

export default function DemoConsole() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 预热 locations 接口，避免首次推送时延迟（演示体验）
    void request.get<string[]>('/locations')
    setMounted(true)
  }, [])

  function addLog(msg: string) {
    setLog((prev) => [`[${new Date().toLocaleTimeString('zh-CN')}] ${msg}`, ...prev.slice(0, 9)])
  }

  async function mockEvent(index: number) {
    setLoading(true)
    try {
      const { data } = await request.post('/mockdev/mock-event', { index })
      addLog(`✅ 已推送：${data.event.title} · ${data.event.location}`)
      window.dispatchEvent(new CustomEvent('refresh_events'))
    } catch {
      addLog('❌ 推送失败，请检查后端服务')
    } finally {
      setLoading(false)
    }
  }

  async function resetEvents() {
    setLoading(true)
    try {
      await request.post('/mockdev/reset-events')
      addLog('🔄 所有事件已重置为待处理')
      window.dispatchEvent(new CustomEvent('refresh_events'))
    } catch {
      addLog('❌ 重置失败')
    } finally {
      setLoading(false)
    }
  }

  async function randomEvent() {
    setLoading(true)
    try {
      const { data } = await request.post('/mockdev/mock-event', {})
      addLog(`✅ 随机推送：${data.event.title} · ${data.event.location}`)
      window.dispatchEvent(new CustomEvent('refresh_events'))
    } catch {
      addLog('❌ 推送失败')
    } finally {
      setLoading(false)
    }
  }

  async function pushSceneEvent(index: number) {
    const tpl = SCENE_TEMPLATES[index]
    if (!tpl) return
    setLoading(true)
    try {
      await request.post('/events', {
        title: tpl.title,
        level: tpl.level,
        location: tpl.location,
        district: tpl.location.split('-')[0],
        scene: tpl.scene,
      })
      addLog(`✅ 场景推送：${SCENE_LABELS[tpl.scene]} · ${tpl.title}`)
      window.dispatchEvent(new CustomEvent('refresh_events'))
    } catch {
      addLog('❌ 场景推送失败，请检查登录态/接口权限')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        title="演示控制台"
      >
        🎮
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span>🎮 演示控制台</span>
            <button type="button" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>快速推送事件</div>
            <div className={styles.btnGrid}>
              {EVENT_TEMPLATES.map((tpl, i) => {
                const label = `${tpl.title}（${tpl.level === 'high' ? '高危' : tpl.level === 'mid' ? '中危' : '低危'}）`
                return (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.mockBtn} ${
                      tpl.level === 'high' ? styles.high : tpl.level === 'mid' ? styles.mid : styles.low
                    }`}
                    onClick={() => mockEvent(i)}
                    disabled={loading}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>控制操作</div>
            <div className={styles.actionRow}>
              <button type="button" className={styles.actionBtn} onClick={randomEvent} disabled={loading}>
                🎲 随机推送
              </button>
              <button type="button" className={`${styles.actionBtn} ${styles.reset}`} onClick={resetEvents} disabled={loading}>
                🔄 重置数据
              </button>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>一键场景演示（C2）</div>
            <div className={styles.btnGrid}>
              {SCENE_TEMPLATES.map((tpl, i) => (
                <button
                  key={tpl.scene}
                  type="button"
                  className={`${styles.mockBtn} ${styles.sceneBtn}`}
                  onClick={() => pushSceneEvent(i)}
                  disabled={loading}
                >
                  <span className={styles.sceneBtnTop}>📌 {SCENE_LABELS[tpl.scene]}</span>
                  <span className={styles.sceneBtnBottom}>{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>

          {log.length > 0 && (
            <div className={styles.logBox}>
              {log.map((l, i) => (
                <div key={i} className={styles.logLine}>
                  {l}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
    ,
    document.body
  )
}
