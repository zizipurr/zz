import { useState } from 'react'
import styles from './TabNav.module.scss'

const TABS = ['总览','智慧社区','城安应急','智慧交通','城市服务']

export default function TabNav() {
  const [active, setActive] = useState('总览')
  return (
    <div className={styles.nav}>
      {TABS.map(tab => (
        <div
          key={tab}
          className={`${styles.tab} ${active === tab ? styles.active : ''}`}
          onClick={() => setActive(tab)}
        >{tab}</div>
      ))}
    </div>
  )
}
