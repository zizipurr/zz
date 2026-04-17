import { Outlet } from 'react-router-dom'
import TopBar from '@/components/TopBar'
import TabNav from '@/components/TabNav'
import styles from './MainLayout.module.scss'

export default function MainLayout() {
  return (
    <div className={styles.outer}>
      <div className={styles.inner}>
        <TopBar />
        <TabNav />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
