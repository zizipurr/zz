import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import request from '@/api/request'
import styles from './Login.module.scss'

// 不允许登录大屏、只能用小程序的角色
const MINIPROGRAM_ONLY_ROLES = [
  'grid_staff',
  'community_owner',
  'community_staff',
  'emergency_responder',
  'traffic_operator',
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()
  const location = useLocation()

  // 路由守卫跳转回来时携带的错误提示
  const routeError = (location.state as { error?: string } | null)?.error ?? ''

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()

    const account = username.trim()
    if (!account || !password) {
      setError('请输入账号和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data } = await request.post('/auth/login', { username: account, password })
      const { token, user } = data

      // 网格员及小程序专属角色不允许登录大屏
      if (MINIPROGRAM_ONLY_ROLES.includes(user.role)) {
        setError('该账号无权限登录')
        return
      }

      login(token, user)

      // super_admin / tenant_admin / grid_supervisor 进大屏
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请重试'
      setError(message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const displayError = error || routeError

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.shell}>

        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.mark}><span>Z</span></div>
            <span className={styles.name}>智<em>城</em>云</span>
          </div>
          <h1 className={styles.title}>区县级 IOC 驾驶舱</h1>
          <p className={styles.sub}>INTELLIGENT OPERATIONS CENTER</p>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          <input
            className={styles.input}
            placeholder="请输入用户名或手机号"
            value={username}
            onChange={e => {
              setUsername(e.target.value)
              setError('')
            }}
            autoComplete="username"
          />
          <div className={styles.passwordWrap}>
            <input
              className={styles.input}
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={e => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {displayError && <p className={styles.error}>{displayError}</p>}

          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading ? '登 录 中...' : '登 录'}
          </button>

          {/* 去掉注册入口，改为联系管理员提示 */}
          <div className={styles.switchRow}>
            <span>如需开通账号，请联系管理员</span>
          </div>
        </form>

      </div>
    </div>
  )
}
