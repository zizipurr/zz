import { useNavigate } from 'react-router-dom'
import styles from './TabNav.module.scss'
import { useSceneStore } from '@/stores/sceneStore'

const TABS = [
  { label: '总览', to: '/dashboard', key: 'overview' as const },
  { label: '智慧社区', to: '/community', key: 'community' as const },
  { label: '城安应急', to: '/emergency', key: 'emergency' as const },
  { label: '智慧交通', to: '/traffic', key: 'traffic' as const },
  { label: '城市服务', to: '/service', key: 'service' as const },
]

export default function TabNav() {
  const navigate = useNavigate()
  const activeScene = useSceneStore((s) => s.activeScene)
  const switchScene = useSceneStore((s) => s.switchScene)
  return (
    <div className={styles.nav}>
      {TABS.map((tab) => {
        const isActive = activeScene === tab.key
        return (
          <button
            key={tab.to}
            type="button"
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => {
              switchScene(tab.key)
              navigate(tab.to)
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
