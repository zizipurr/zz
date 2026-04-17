<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore, type UserInfo } from '@/stores/auth'
import AppTabBar from '@/components/AppTabBar/index.vue'
import { getMyStats, type StaffStats } from '@/api/event'
import { http } from '@/utils/request'

const auth = useAuthStore()
const userInfo = computed(() => auth.userInfo)

const displayName = computed(() =>
  userInfo.value?.realName || userInfo.value?.username || '未登录'
)
const avatarLetter = computed(() => {
  const name = userInfo.value?.realName || userInfo.value?.username || ''
  return name.charAt(0).toUpperCase() || '?'
})

const TENANT_NAME_MAP: Record<string, string> = {
  shenzhen: '深圳市',
  guangzhou: '广州市',
}
const cityName = computed(() =>
  TENANT_NAME_MAP[userInfo.value?.tenantId ?? ''] || userInfo.value?.tenantId || '—'
)

/** 顶部副标题：仅展示工号（不展示区县） */
const jobSubtitle = computed(() => {
  const j = userInfo.value?.jobNumber?.trim()
  return j ? `工号： ${j}` : ''
})

const stats = ref<StaffStats>({
  completedCount: 0,
  reportedCount: 0,
  processingCount: 0,
  pendingCount: 0,
  completionRate: 0,
  month: '',
})

async function refreshProfileUser() {
  if (!auth.isLoggedIn) return
  try {
    const me = await http.get<UserInfo>('/auth/profile')
    const merged: UserInfo = {
      ...(auth.userInfo as UserInfo),
      ...me,
      jobNumber: me?.jobNumber ?? auth.userInfo?.jobNumber ?? null,
    }
    auth.setUser(merged)
  } catch {
    // 离线或接口失败时保留本地缓存
  }
}

onMounted(async () => {
  if (!auth.isLoggedIn) return
  await refreshProfileUser()
  try {
    const data = await getMyStats()
    if (data) stats.value = data
  } catch {
    // 接口失败时显示默认值 0
  }
})

onShow(() => {
  void refreshProfileUser()
})

const progressColor = computed(() => {
  const r = stats.value.completionRate
  if (r >= 80) return '#3482ff'
  if (r >= 60) return '#f59e0b'
  return '#e11d48'
})

/** 四项合计为 0 且完成率为 0 时不展示「完成率」整块 */
const showCompletionSection = computed(() => {
  const s = stats.value
  const total =
    s.completedCount + s.reportedCount + s.processingCount + s.pendingCount
  const rate = Number(s.completionRate)
  return !(total === 0 && rate === 0)
})

function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res) => {
      if (res.confirm) auth.logout()
    },
  })
}
</script>

<template>
  <view class="page">
    <view class="page-scroll">
      <!-- 顶部英雄区 -->
      <view class="hero">
        <view class="user-info-wrapper">
          <view class="user-info">
            <view class="avatar">
              <text class="avatar-letter">{{ avatarLetter }}</text>
            </view>
            <view class="user-meta">
              <text class="user-name">{{ displayName }}</text>
              <text class="user-sub">{{ jobSubtitle }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 工作统计卡片 -->
      <view class="card animate-fade-up">
      <view class="card-header">
        <text class="card-title">本月工作统计</text>
        <text v-if="stats.month" class="card-sub">{{ stats.month }}</text>
      </view>

      <view class="stats-grid">
        <view class="stat-cell">
          <text class="stat-num primary">{{ stats.completedCount }}</text>
          <text class="stat-label">本月处置</text>
        </view>
        <view class="stat-cell">
          <text class="stat-num blue">{{ stats.reportedCount }}</text>
          <text class="stat-label">本月上报</text>
        </view>
        <view class="stat-cell">
          <text class="stat-num orange">{{ stats.processingCount }}</text>
          <text class="stat-label">处理中</text>
        </view>
        <view class="stat-cell">
          <text class="stat-num gray">{{ stats.pendingCount }}</text>
          <text class="stat-label">待处理</text>
        </view>
      </view>

      <view v-if="showCompletionSection" class="progress-wrap">
        <view class="progress-row">
          <text class="progress-label">完成率</text>
          <text class="progress-value" :style="{ color: progressColor }">{{ stats.completionRate }}%</text>
        </view>
        <view class="progress-track">
          <view
            class="progress-bar"
            :style="{ width: stats.completionRate + '%', background: progressColor }"
          />
        </view>
      </view>
    </view>

    <!-- 账号信息卡片 -->
    <view class="card">
      <view class="divider" />
      <view class="menu-item">
        <text class="menu-label">所属区县</text>
        <text class="menu-value">{{ userInfo?.district || '—' }}</text>
      </view>
      <view class="divider" />
      <view class="menu-item">
        <text class="menu-label">所属城市</text>
        <text class="menu-value">{{ cityName }}</text>
      </view>
    </view>

    <!-- 操作卡片 -->
    <view class="card">
      <view class="menu-item danger" @tap="onLogout">
        <view class="menu-left">
          <text class="menu-label">退出登录</text>
        </view>
        <uni-icons type="right" size="16" />
      </view>
    </view>
    </view>

    <app-tab-bar active="profile" />
  </view>
</template>

<style lang="scss" scoped>
.page {
  box-sizing: border-box;
  height: 100vh;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: calc(110rpx + env(safe-area-inset-bottom));
}

.page-scroll {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.hero {
  position: relative;
  height: 400rpx;
  background: linear-gradient(180deg, #7ad2ff 0%, #f1f5f9 100%);
  padding: 0 40rpx;
  display: flex;
  align-items: flex-end; /* 让内容靠下，为卡片负 margin 留位置 */
}

.user-info-wrapper {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 80rpx; /* 控制头像在背景中的高度位置 */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: #3482ff;
  border: 6rpx solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(52, 130, 255, 0.2);
}

.avatar-letter {
  font-size: 48rpx;
  font-weight: 700;
  color: #ffffff;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.user-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #1e293b;
}

.user-sub {
  font-size: 26rpx;
  color: #64748b;
}

/* 通用卡片 */
.card {
  margin: 0 28rpx 24rpx; /* 调整间距 */
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);

  &:first-of-type {
    margin-top: -40rpx; /* 压在 hero 背景上 */
  }
}

/* 工作统计卡片内部 */
.card-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 36rpx 40rpx 24rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1e293b;
}

.card-sub {
  font-size: 24rpx;
  color: #94a3b8;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rpx;
  background: #f1f5f9;
  margin: 0 40rpx 32rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.stat-cell {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 0;
  gap: 8rpx;
}

.stat-num {
  font-size: 52rpx;
  font-weight: 800;
  line-height: 1;

  &.primary { color: #3482ff; }
  &.blue    { color: #2b6aff; }
  &.orange  { color: #f59e0b; }
  &.gray    { color: #94a3b8; }
}

.stat-label {
  font-size: 22rpx;
  color: #94a3b8;
}

.progress-wrap {
  padding: 0 40rpx 36rpx;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.progress-label {
  font-size: 26rpx;
  color: #64748b;
}

.progress-value {
  font-size: 26rpx;
  font-weight: 700;
}

.progress-track {
  height: 12rpx;
  background: #f1f5f9;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.6s ease;
}

/* 菜单项 */
.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 40rpx;

  &:active { background: #f8fafc; }
  &.danger:active { background: #fff1f2; }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.menu-label {
  font-size: 28rpx;
  color: #64748b;
}

.menu-value {
  font-size: 28rpx;
  color: #1e293b;
}

.danger-text {
  color: #e11d48;
  font-weight: 500;
}

.divider {
  height: 1rpx;
  background: #f1f5f9;
  margin: 0 40rpx;
}

@keyframes auraFadeUp {
  from { opacity: 0; transform: translateY(40rpx); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: auraFadeUp 0.4s ease both;
}
</style>