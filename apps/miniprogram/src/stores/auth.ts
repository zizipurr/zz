import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  username: string
  role: string
  tenantId: string | null
  district: string | null
  realName: string | null
  nickname?: string | null
  phone?: string | null
  jobNumber?: string | null
  status?: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    (uni.getStorageSync('staff_token') as string) || null
  )
  const userInfo = ref<UserInfo | null>(
    JSON.parse((uni.getStorageSync('staff_user') as string) || 'null')
  )
  const isLoggedIn = computed(() => !!token.value)

  // 兼容旧代码中 user 的引用
  const user = userInfo

  function setToken(newToken: string) {
    uni.setStorageSync('staff_token', newToken)
    token.value = newToken
  }

  function setUser(newUser: UserInfo) {
    uni.setStorageSync('staff_user', JSON.stringify(newUser))
    userInfo.value = newUser
  }

  function login(newToken: string, newUser: UserInfo) {
    setToken(newToken)
    setUser(newUser)
  }

  function logout() {
    uni.removeStorageSync('staff_token')
    uni.removeStorageSync('staff_user')
    token.value = null
    userInfo.value = null
    uni.reLaunch({ url: '/pages/login/index' })
  }

  return { token, user, userInfo, isLoggedIn, login, setToken, setUser, logout }
})
