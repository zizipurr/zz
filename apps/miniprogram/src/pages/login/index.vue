<script setup lang="ts">
import { ref } from 'vue'
import { http } from '@/utils/request'
import { useAuthStore, type UserInfo } from '@/stores/auth'

interface LoginResult {
  token: string
  user: UserInfo
}

interface UniLike {
  login?: (options: {
    provider?: string
    success?: (res: { code?: string }) => void
    fail?: (err: any) => void
  }) => void
}

// 小程序允许登录的角色
const ALLOWED_ROLES = ['super_admin', 'grid_staff', 'grid_supervisor', 'grid_city_admin']

const auth = useAuthStore()
const loginType = ref('pwd') // 'pwd' 或 'sms'
const username = ref('')
const password = ref('')
const agreement = ref(false)
const errorMsg = ref('')
const loading = ref(false)

function precheckLogin(): boolean {
  if (!agreement.value) {
    errorMsg.value = '请先勾选并同意《用户协议与隐私政策》'
    return false
  }
  if (loginType.value === 'sms') {
    errorMsg.value = '验证码登录暂未开放，请使用密码登录'
    return false
  }
  if (!username.value.trim() && !password.value) {
    errorMsg.value = '请先输入账号和密码'
    return false
  }
  if (!username.value.trim()) {
    errorMsg.value = '请先输入手机号或用户名'
    return false
  }
  if (!password.value) {
    errorMsg.value = '请先输入密码'
    return false
  }
  return true
}

async function handleLogin() {
  if (loading.value) return
  if (!precheckLogin()) return
  loading.value = true
  errorMsg.value = ''
  try {
    const wxCode = await new Promise<string | undefined>((resolve) => {
      const uniAny = uni as unknown as UniLike
      if (typeof uniAny.login !== 'function') {
        resolve(undefined)
        return
      }
      uniAny.login({
        provider: 'weixin',
        success: (res) => resolve(res?.code),
        fail: () => resolve(undefined),
      })
    })

    const data = await http.post<LoginResult>('/auth/login', {
      username: username.value.trim(),
      password: password.value,
      ...(wxCode ? { wxCode } : {}),
    })

    const { token, user } = data!
    const normalizedUser: UserInfo = {
      ...user,
      jobNumber: user?.jobNumber ?? null,
    }
    // 只有网格员相关角色才允许使用小程序
    if (!ALLOWED_ROLES.includes(normalizedUser.role)) {
      errorMsg.value = '该账号请使用管理端登录'
      return
    }

    auth.login(token, normalizedUser)
    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.reLaunch({ url: '/pages/orders/index' })
    }, 500)
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}

function handleAgreementChange(e: { detail: { value: string[] } }) {
  agreement.value = (e.detail.value?.length ?? 0) > 0
}

function goRegister() {
  uni.navigateTo({ url: '/pages/register/index' })
}

</script>

<template>
  <view class="page">
    <!-- 1. 顶部 Logo 区域 -->
    <view class="logo-section">
      <view class="logo-wrapper">
        <view class="mark">Z</view>
        <view class="logo-name">智城云</view>
      </view>
    </view>

    <!-- 2. 登录卡片 -->
    <view class="login-card animate-fade-up">
      <!-- 登录类型切换 -->
      <view class="tabs">
        <!-- <view class="tab" :class="{ active: loginType === 'sms' }" @tap="loginType = 'sms'">
          验证码登录
          <view class="line" />
        </view> -->
        <view class="tab" :class="{ active: loginType === 'pwd' }" @tap="loginType = 'pwd'">
          登录
          <view class="line" />
        </view>
      </view>

      <!-- 表单区域 -->
      <view class="form-body">
        <view class="input-item">
          <input class="input" type="text" placeholder="请输入手机号/用户名" v-model="username" @input="errorMsg = ''" />
        </view>

        <view class="input-item" v-if="loginType === 'pwd'">
          <input class="input" type="password" placeholder="请输入密码" v-model="password" @input="errorMsg = ''" />
        </view>

        <view class="input-item" v-else>
          <input class="input" type="number" placeholder="请输入验证码" />
          <text class="get-code">获取验证码</text>
        </view>

        <view v-if="errorMsg" class="error-msg">
          {{ errorMsg }}
        </view>

        <button
          class="btn-login"
          :class="{ enabled: agreement && !!username && !!password && loginType === 'pwd' }"
          :disabled="loading"
          :loading="loading"
          @tap="handleLogin"
        >
          登 录
        </button>

        <!-- 协议勾选 -->
        <view class="agreement-row">
          <checkbox-group @change="handleAgreementChange">
            <label class="checkbox-wrapper">
              <checkbox value="all" :checked="agreement" color="#87c7ff" style="transform:scale(0.6)" />
              <text class="gray">已阅读并同意</text>
              <text class="link">《用户协议与隐私政策》</text>
            </label>
          </checkbox-group>
        </view>

        <!-- 注册入口 -->
        <view class="register-row">
          <text class="gray">没有账号？</text>
          <text class="link" @tap="goRegister">立即注册</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: var(--aura-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
  overflow: hidden;
}

/* Logo 样式 */
.logo-section {
  padding-top: 160rpx;
  margin-bottom: 80rpx;
  text-align: center;

  .logo-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;

    .mark {
      width: 68rpx;
      height: 68rpx;
      background: var(--primary);
      color: #fff;
      border-radius: 14rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 40rpx;
      margin-right: 20rpx;
      box-shadow: 0 4rpx 12rpx rgba(52, 130, 255, 0.2);
    }

    .logo-name {
      font-size: 52rpx;
      font-weight: 900;
      color: var(--primary);
      letter-spacing: 2rpx;
    }
  }
}

/* 核心登录卡片 */
.login-card {
  width: 85%;
  max-width: 600rpx;
  background: var(--card-bg);
  border-radius: 36rpx;
  padding: 80rpx 48rpx 60rpx;
  box-shadow: var(--shadow);
  border: 1px solid var(--card-border);

  .tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 60rpx;

    .tab {
      font-size: 32rpx;
      color: var(--text-muted);
      position: relative;
      padding-bottom: 16rpx;
      transition: all 0.3s;

      &.active {
        color: var(--text-main);
        font-weight: 800;

        .line {
          width: 50rpx;
          height: 6rpx;
          background: var(--primary);
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 10rpx;
        }
      }
    }
  }
}

/* 输入框样式 */
.input-item {
  background: var(--input-bg);
  border-radius: 16rpx;
  height: 104rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  margin-bottom: 32rpx;

  .input {
    flex: 1;
    font-size: 30rpx;
    color: var(--text-main);
  }

  .get-code {
    font-size: 26rpx;
    color: var(--text-muted);
    border-left: 2rpx solid #dee4e9;
    padding-left: 24rpx;
    margin-left: 10rpx;
  }
}

.error-msg {
  margin: -12rpx 0 20rpx;
  padding: 10rpx 20rpx;
  border-radius: 16rpx;
  background: rgba(225, 29, 72, 0.08);
  color: #e11d48;
  font-size: 26rpx;
  line-height: 1.4;
}

/* 登录按钮 */
.btn-login {
  width: 100%;
  height: 104rpx;
  background: rgba(30, 41, 59, 0.08);
  border-radius: 18rpx;
  color: var(--text-sub);
  font-size: 36rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin-top: 20rpx;
  margin-bottom: 40rpx;
  letter-spacing: 4rpx;
  transition: transform 0.2s;

  &::after { border: none; }

  &:active {
    transform: scale(0.97);
    opacity: 0.85;
  }

  &[disabled] {
    opacity: 0.75;
  }

  &.enabled {
    background: var(--primary-gradient);
    border-color: transparent;
    color: #fff;
  }
}

/* 协议部分 */
.agreement-row {
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    white-space: nowrap;
  }
  .gray { color: var(--text-muted); }
  .link { color: var(--primary); font-weight: 500; }
}

.register-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 24rpx;
  font-size: 26rpx;
  .gray { color: var(--text-muted); }
  .link { color: var(--primary); font-weight: 500; margin-left: 8rpx; }
}

.action-bar { margin-bottom: 30rpx; }
.third-party { margin-top: auto; padding-bottom: 60rpx; text-align: center; }
.footer { padding-bottom: 40rpx; text-align: center; font-size: 22rpx; color: var(--text-muted); }

/* 入场动画 */
.animate-fade-up {
  animation: auraFadeUp 0.7s cubic-bezier(0.2, 0, 0.2, 1);
}
</style>
