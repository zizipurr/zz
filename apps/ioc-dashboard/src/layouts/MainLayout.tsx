import { Outlet, useLocation } from 'react-router-dom'
import TopBar from '@/components/TopBar'
import TabNav from '@/components/TabNav'
import styles from './MainLayout.module.scss'

export default function MainLayout() {
  const location = useLocation()
  const isMessagesPage = location.pathname.startsWith('/messages')

  return (
    <div className={styles.outer}>
      <div className={styles.inner}>
        {!isMessagesPage && <TopBar />}
        {!isMessagesPage && <TabNav />}
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
