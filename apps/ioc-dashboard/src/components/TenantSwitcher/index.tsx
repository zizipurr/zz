import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import styles from './TenantSwitcher.module.scss'

interface TenantItem {
  id: string
  name: string
}

function TenantSwitcherInner() {
  const currentTenantId = useAuthStore(s => s.currentTenantId)
  const setCurrentTenant = useAuthStore(s => s.setCurrentTenant)
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    request.get<TenantItem[]>('/locations/tenants').then(({ data }) => {
      setTenants(data ?? [])
    }).catch(() => {})
  }, [])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current
      if (!el) return
      if (el.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const selectedLabel = useMemo(() => {
    if (currentTenantId === null) return '全局'
    const t = tenants.find(x => x.id === currentTenantId)
    return t?.name ?? currentTenantId
  }, [currentTenantId, tenants])

  const options = useMemo(() => {
    const base = [{ id: null as string | null, name: '全局' }]
    return [...base, ...tenants.map(t => ({ id: t.id, name: t.name }))]
  }, [tenants])

  return (
    <div className={styles.switcher}>
      <div ref={wrapRef} className={styles.customSelect}>
        <button
          type="button"
          className={`${styles.selectTrigger} ${open ? styles.open : ''}`}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
        >
          <span>{selectedLabel}</span>
          <span className={styles.arrow}>▾</span>
        </button>

        {open && (
          <div className={styles.dropdown}>
            {options.map(o => (
              <div
                key={String(o.id)}
                className={`${styles.option} ${currentTenantId === o.id ? styles.selected : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setCurrentTenant(o.id)
                  setOpen(false)
                }}
              >
                {o.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TenantSwitcher() {
  const role = useAuthStore(s => s.user?.role)
  if (role !== 'super_admin') return null
  return <TenantSwitcherInner />
}
