import { create } from 'zustand'

export interface AuthUser {
  id: number
  username: string
  role: string
  tenantId: string | null
  district: string | null
  realName: string | null
  nickname?: string | null
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isLogin: boolean
  // super_admin 切换租户视角用；null 表示全局视角
  currentTenantId: string | null
  login: (token: string, user: AuthUser) => void
  logout: () => void
  setCurrentTenant: (tenantId: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('zcy_token'),
  user: JSON.parse(localStorage.getItem('zcy_user') ?? 'null'),
  isLogin: !!localStorage.getItem('zcy_token'),
  currentTenantId: null,
  login: (token, user) => {
    localStorage.setItem('zcy_token', token)
    localStorage.setItem('zcy_user', JSON.stringify(user))
    set({ token, user, isLogin: true, currentTenantId: null })
  },
  logout: () => {
    localStorage.removeItem('zcy_token')
    localStorage.removeItem('zcy_user')
    set({ token: null, user: null, isLogin: false, currentTenantId: null })
    // HashRouter：只改 hash，不刷新整页
    window.location.hash = '#/login'
  },
  setCurrentTenant: (tenantId) => {
    set({ currentTenantId: tenantId })
    window.dispatchEvent(new CustomEvent('tenant_changed'))
  },
}))
