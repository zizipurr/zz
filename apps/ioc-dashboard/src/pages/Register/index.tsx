import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import request from '@/api/request'
import styles from '@/pages/Login/Login.module.scss'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleRegister(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!username || !password || !confirmPassword) {
      setError('请完整填写注册信息')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setLoading(true)
    setError('')
    try {
      await request.post('/auth/register', { username, password })
      navigate('/login')
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败，请重试'
      setError(message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg} aria-hidden />
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.mark}>
              <span>Z</span>
            </div>
            <span className={styles.name}>
              智<em>城</em>云
            </span>
          </div>
          <h1 className={styles.title}>账号注册</h1>
          <p className={styles.sub}>CREATE ACCOUNT</p>
        </div>

        <form className={styles.form} onSubmit={handleRegister}>
          <input
            className={styles.input}
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => {
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
              onChange={(e) => {
                setPassword(e.target.value)
                setError('')
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className={styles.passwordWrap}>
            <input
              className={styles.input}
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError('')
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowConfirmPassword((v) => !v)}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? '注 册 中...' : '注 册'}
          </button>
          <div className={styles.switchRow}>
            <span>已有账号？</span>
            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => {
                window.location.hash = '#/login'
              }}
            >
              返回登录
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
