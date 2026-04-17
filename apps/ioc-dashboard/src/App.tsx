import type { ReactNode } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Register from './pages/Register'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'

// 只能使用小程序、不允许进大屏的角色
const MINIPROGRAM_ONLY_ROLES = [
  'grid_staff',
  'community_owner',
  'community_staff',
  'emergency_responder',
  'traffic_operator',
]

function RequireAuth({ children }: { children: ReactNode }) {
  const isLogin = useAuthStore(s => s.isLogin)
  const user = useAuthStore(s => s.user)

  if (!isLogin) return <Navigate to="/login" replace />

  // 小程序专属角色不允许进大屏
  if (user && MINIPROGRAM_ONLY_ROLES.includes(user.role)) {
    return <Navigate to="/login" replace state={{ error: '请使用小程序登录' }} />
  }

  return children
}

export default function App() {
  return (
    <div className="app-shell">
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RequireAuth><MainLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </HashRouter>
    </div>
  )
}
