<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { http } from '@/utils/request'

const realName = ref('')
const username = ref('')
const phone = ref('')
const district = ref('')
const districtIndex = ref(0)
const districts = ref<string[]>([])
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const loading = ref(false)

const PHONE_RE = /^1[3-9]\d{9}$/
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/

onMounted(async () => {
  try {
    const data = await http.get<string[]>('/locations/districts?tenantId=shenzhen')
    districts.value = data ?? []
  } catch {
    // 静默处理，picker 无选项时阻止提交
  }
})

function clearError() {
  if (errorMsg.value) errorMsg.value = ''
}

function onDistrictChange(e: { detail: { value: number } }) {
  districtIndex.value = e.detail.value
  district.value = districts.value[e.detail.value] ?? ''
  clearError()
}

function validate(): boolean {
  const name = realName.value.trim()
  if (!name) { errorMsg.value = '请输入真实姓名'; return false }
  if (name.length < 2 || name.length > 10) { errorMsg.value = '姓名需为 2-10 个字符'; return false }

  const uname = username.value.trim()
  if (!uname) { errorMsg.value = '请输入用户名'; return false }
  if (!USERNAME_RE.test(uname)) { errorMsg.value = '用户名为 3-20 位字母、数字或下划线'; return false }

  if (!phone.value) { errorMsg.value = '请输入手机号'; return false }
  if (!PHONE_RE.test(phone.value)) { errorMsg.value = '请输入正确的手机号'; return false }

  if (!district.value) { errorMsg.value = '请选择所属区县'; return false }

  if (!password.value) { errorMsg.value = '请输入密码'; return false }
  if (password.value.length < 6) { errorMsg.value = '密码不少于 6 位'; return false }
  if (password.value !== confirmPassword.value) { errorMsg.value = '两次密码输入不一致'; return false }

  return true
}

async function handleRegister() {
  errorMsg.value = ''
  if (!validate()) return
  loading.value = true
  try {
    await http.post<{
      user?: { jobNumber?: string | null }
    }>('/auth/register', {
      realName: realName.value.trim(),
      username: username.value.trim(),
      phone: phone.value,
      district: district.value,
      password: password.value,
    })
    uni.showToast({
      title: '注册成功',
      icon: 'success',
    })
    setTimeout(() => uni.navigateBack(), 500)
  } catch (err: any) {
    errorMsg.value = err?.message || '注册失败，请重试'
  } finally {
    loading.value = false
  }
}

const canSubmit = computed(() =>
  !!(realName.value && username.value && phone.value &&
    district.value && password.value && confirmPassword.value)
)

function goBack() { uni.navigateBack() }
</script>

<template>
  <view class="page">
    <view class="logo-section">
      <view class="logo-wrapper animate-drop">
        <view class="mark">Z</view>
        <view class="logo-name">智城云</view>
      </view>
    </view>

    <view class="card animate-fade-up">
      <view class="card-header">
        <text class="card-title">注册</text>
        <view class="title-line"></view>
      </view>

      <view class="form-group">
        <!-- 1. 真实姓名 -->
        <view class="input-wrapper">
          <uni-icons type="person" size="18" color="#94a3b8" />
          <input class="input" type="text" placeholder="请输入真实姓名" v-model="realName" @input="clearError" />
        </view>

        <!-- 2. 用户名 -->
        <view class="input-wrapper">
          <uni-icons type="contact" size="18" color="#94a3b8" />
          <input class="input" type="text" placeholder="昵称 / 登录账号" v-model="username" @input="clearError" />
        </view>

        <!-- 3. 手机号 -->
        <view class="input-wrapper">
          <uni-icons type="phone" size="18" color="#94a3b8" />
          <input class="input" type="number" placeholder="请输入手机号" v-model="phone" @input="clearError" maxlength="11" />
        </view>

        <!-- 4. 所属区县 -->
        <picker mode="selector" :range="districts" :value="districtIndex" :disabled="districts.length === 0" @change="onDistrictChange">
          <view class="input-wrapper picker-item">
            <view class="picker-left">
              <uni-icons type="location" size="18" color="#94a3b8" />
              <text :class="['input-text', { placeholder: !district }]">
                {{ district || (districts.length === 0 ? '加载中...' : '请选择所属区县') }}
              </text>
            </view>
            <uni-icons type="bottom" size="14" color="#cbd5e1" />
          </view>
        </picker>

        <!-- 5. 密码 -->
        <view class="field">
          <view class="input-wrapper">
            <uni-icons type="locked" size="18" color="#94a3b8" />
            <input class="input" type="password" placeholder="请输入密码" v-model="password" @input="clearError" />
          </view>
          <text class="help-text">至少 6 位，建议字母 + 数字</text>
        </view>

        <!-- 6. 确认密码 -->
        <view class="input-wrapper">
          <uni-icons type="checkbox" size="18" color="#94a3b8" />
          <input class="input" type="password" placeholder="请再次输入密码" v-model="confirmPassword" @input="clearError" />
        </view>
      </view>

      <view v-if="errorMsg" class="error-msg animate-shake">
        <uni-icons type="info" size="14" color="#e11d48" />
        <text style="margin-left: 8rpx;">{{ errorMsg }}</text>
      </view>

      <button
        class="btn-submit"
        :class="{ enabled: canSubmit }"
        :disabled="loading"
        :loading="loading"
        @tap="handleRegister"
      >
        立即注册
      </button>

      <view class="switch-row">
        <text class="switch-text">已有账号？</text>
        <text class="switch-link" @tap="goBack">返回登录</text>
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
  padding: 0 44rpx;
}

.logo-section {
  padding-top: 100rpx;
  margin-bottom: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

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
  
  .logo-sub {
    font-size: 24rpx;
    color: #94a3b8;
    letter-spacing: 4rpx;
  }
}

.card {
  width: 100%;
  box-sizing: border-box;
  background: var(--card-bg);
  border-radius: 48rpx;
  padding: 64rpx 44rpx;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--card-border);
}

.card-header {
  margin-bottom: 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;

  .card-title {
    font-size: 42rpx;
    font-weight: 800;
    color: var(--text-main);
    margin-bottom: 12rpx;
  }
  
  .title-line {
    width: 40rpx;
    height: 6rpx;
    background: var(--primary);
    border-radius: 4rpx;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.input-wrapper {
  background: var(--input-bg);
  border: 2rpx solid transparent;
  border-radius: 24rpx;
  height: 108rpx;
  display: flex;
  align-items: center;
  padding: 0 32rpx;
  transition: all 0.25s ease;

  /* 模拟 Focus 效果 */
  &:focus-within {
    background: var(--card-bg);
    border-color: var(--primary);
    box-shadow: 0 0 0 4rpx rgba(52, 130, 255, 0.1);
  }

  .input {
    flex: 1;
    margin-left: 20rpx;
    font-size: 30rpx;
    color: var(--text-main);
  }
  
  .input-text {
    margin-left: 20rpx;
    font-size: 30rpx;
    color: var(--text-main);
    &.placeholder { color: var(--text-muted); }
  }
}

.picker-item {
  .picker-left {
    display: flex;
    align-items: center;
    flex: 1;
  }
}

.field {
  display: flex;
  flex-direction: column;
}

.help-text {
  margin-top: 10rpx;
  padding-left: 12rpx;
  font-size: 22rpx;
  color: var(--text-muted);
}

.error-msg {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  background: rgba(225, 29, 72, 0.08);
  color: #e11d48;
  font-size: 26rpx;
}

.btn-submit {
  width: 100%;
  height: 110rpx;
  background: rgba(30, 41, 59, 0.08);
  border-radius: 28rpx;
  color: var(--text-sub);
  font-size: 34rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  margin: 48rpx 0 40rpx;
  transition: all 0.3s ease;

  &::after { border: none; }
  
  &.enabled {
    background: var(--primary-gradient);
    color: #fff;
    box-shadow: 0 12rpx 24rpx -8rpx rgba(52, 130, 255, 0.4);
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 4rpx 10rpx rgba(52, 130, 255, 0.2);
    }
  }
}

.switch-row {
  display: flex;
  justify-content: center;
  font-size: 28rpx;
  
  .switch-text { color: var(--text-muted); }
  .switch-link { 
    color: var(--primary); 
    font-weight: 600; 
    margin-left: 12rpx;
    text-decoration: underline;
  }
}

/* 动画效果 */
.animate-fade-up {
  animation: fadeUp 0.6s ease-out forwards;
}

.animate-drop {
  animation: dropDown 0.8s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes dropDown {
  from { opacity: 0; transform: translateY(-50rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8rpx); }
  75% { transform: translateX(8rpx); }
}
</style>