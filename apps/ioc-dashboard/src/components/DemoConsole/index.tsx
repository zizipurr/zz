import { useEffect, useState } from 'react'
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

export default function DemoConsole() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<string[]>([])
  const [log, setLog] = useState<string[]>([])

  useEffect(() => {
    request.get<string[]>('/locations').then((res) => {
      setLocations(res.data)
    })
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

  return (
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
                const location = locations[i] || `位置${i + 1}`
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
  )
}
