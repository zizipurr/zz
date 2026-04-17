interface ApiResponse<T = unknown> {
  code: number
  data: T | null
  message: string
}

// 统一使用 VITE_API_BASE_URL：
//   H5 本地开发：相对路径（vite proxy 转发到 localhost:3000）
//   小程序 dev/prod 构建：.env.dev / .env.prod 里已配置完整 https 地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

function request<T = unknown>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('staff_token') as string | undefined
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success(res) {
        const body = res.data as ApiResponse<T>
        if (res.statusCode === 401) {
          // 登录接口本身返回 401 时，只保留错误信息，不触发登录页重定向。
          if (url.includes('/auth/login')) {
            const message = (body && typeof body === 'object' && 'message' in body && body.message) || '账号或密码错误'
            reject(new Error(message))
            return
          }

          uni.removeStorageSync('staff_token')
          uni.removeStorageSync('staff_user')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期'))
          return
        }
        if (body && typeof body === 'object' && 'code' in body) {
          if (body.code === 0) {
            resolve(body.data as T)
          } else {
            reject(new Error(body.message || '请求失败'))
          }
        } else {
          resolve(res.data as T)
        }
      },
      fail(err) {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

export const http = {
  get: <T = unknown>(url: string) => request<T>('GET', url),
  post: <T = unknown>(url: string, data?: Record<string, unknown>) =>
    request<T>('POST', url, data),
}
