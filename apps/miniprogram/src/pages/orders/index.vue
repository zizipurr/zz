<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import AppTabBar from '@/components/AppTabBar/index.vue'
import { http } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import { useNotifyStore } from '@/stores/notify'
import { usePolling } from '@/hooks/usePolling'
import { useEventNotify } from '@/composables/useEventNotify'
import { getWorkorderStats, type WorkorderStats } from '@/api/event'

type Level = 'all' | 'high' | 'mid' | 'low'
type Status = 'all' | 'pending' | 'doing' | 'done'

interface EventItem {
  id: number
  title: string
  level: string
  status: string
  location: string | null
  district: string | null
  street: string | null
  reporterId: number | null
  createdAt: string
}

const LEVEL_MAP: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: '高危', color: '#e11d48', bg: '#ffe4e6' },
  mid:  { label: '中危', color: '#ea580c', bg: '#ffedd5' },
  low:  { label: '低危', color: '#0284c7', bg: '#e0f2fe' },
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: '#f59e0b', bg: '#fef3c7' },
  doing:   { label: '处理中', color: '#2b6aff', bg: '#eff6ff' },
  done:    { label: '已完结', color: '#16a34a', bg: '#dcfce7' },
}

const LEVEL_OPTS: Array<{ value: Level; label: string; color?: string }> = [
  { value: 'all',  label: '全部' },
  { value: 'high', label: '高危', color: '#e11d48' },
  { value: 'mid',  label: '中危', color: '#ea580c' },
  { value: 'low',  label: '低危', color: '#0284c7' },
]

const STATUS_OPTS: Array<{ value: Status; label: string }> = [
  { value: 'all',     label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'doing',   label: '处理中' },
  { value: 'done',    label: '已完结' },
]

const auth = useAuthStore()
const notifyStore = useNotifyStore()
const events = ref<EventItem[]>([])
const loading = ref(true)
const filterLevel = ref<Level>('all')
const filterStatus = ref<Status>('all')
const filterExpanded = ref(false)

const stats = ref<WorkorderStats>({ pendingCount: 0, doingCount: 0, doneCount: 0 })

async function loadStats() {
  try {
    const data = await getWorkorderStats()
    if (data) stats.value = data
  } catch {
    // 静默处理，不影响列表
  }
}

function onStatsTap(status: Status) {
  filterStatus.value = status
  filterExpanded.value = false
}

// 启动/停止 Socket 监听
const { startListen, stopListen } = useEventNotify()
onMounted(() => { startListen(); void loadStats() })
onUnmounted(() => stopListen())

async function fetchEvents() {
  if (!auth.isLoggedIn) {
    loading.value = false
    events.value = []
    return
  }

  try {
    const data = await http.get<EventItem[]>('/events')
    events.value = data ?? []
    void loadStats()
  } catch {
    // 静默处理
  } finally {
    loading.value = false
  }
}

const filteredEvents = computed(() => {
  return events.value.filter((ev) => {
    const levelOk = filterLevel.value === 'all' || ev.level === filterLevel.value
    const statusOk = filterStatus.value === 'all' || ev.status === filterStatus.value
    return levelOk && statusOk
  })
})

const hasActiveFilter = computed(() => filterLevel.value !== 'all' || filterStatus.value !== 'all')

onShow(() => {
  if (!auth.isLoggedIn) {
    notifyStore.clearNotify()
    return
  }
  fetchEvents()
  void notifyStore.syncUnreadCount()
  void loadStats()
})
usePolling(fetchEvents, 3000, () => auth.isLoggedIn)

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function goDetail(id: number) {
  uni.navigateTo({ url: `/pages/order-detail/index?id=${id}` })
}

function goReport() {
  uni.navigateTo({ url: '/pages/report-event/index' })
}

function getLevelLabel() {
  return LEVEL_OPTS.find((o) => o.value === filterLevel.value)?.label ?? ''
}

function getStatusLabel() {
  return STATUS_OPTS.find((o) => o.value === filterStatus.value)?.label ?? ''
}

function isSelfReported(ev: EventItem) {
  return auth.userInfo?.id != null && ev.reporterId === auth.userInfo.id
}
</script>

<template>
  <view class="page">
    <!-- 头部 + 筛选：固定不随工单列表滚动 -->
    <view class="orders-top">
      <view class="header">
        <view class="header-info">
          <text class="header-title">当前任务</text>
          <text class="header-sub">
            {{ auth.userInfo?.realName || auth.userInfo?.username }}
            <text v-if="auth.userInfo?.district"> · {{ auth.userInfo.district }}</text>
          </text>
        </view>
        <view class="header-right">
          <view class="icon-btn report-btn" @tap="goReport">+ 上报</view>
          <view class="icon-btn" @tap="fetchEvents">刷新</view>
          <!-- <view class="notify-btn" @tap="() => { void notifyStore.markAllRead() }">
            <uni-icons type="notification" size="18" color="#64748b" style="font-size: 36rpx;" />
            <view v-if="notifyStore.unreadCount > 0" class="notify-badge">
              {{ notifyStore.unreadCount > 99 ? '99+' : notifyStore.unreadCount }}
            </view>
          </view> -->
        </view>
      </view>

      <!-- 待办统计条 -->
      <view class="stats-bar">
        <view class="stats-item" @tap="onStatsTap('pending')">
          <text class="stats-num" :class="{ 'num-danger': stats.pendingCount > 0 }">
            {{ stats.pendingCount }}
          </text>
          <text class="stats-label">待处理</text>
        </view>
        <view class="stats-divider" />
        <view class="stats-item" @tap="onStatsTap('doing')">
          <text class="stats-num" :class="{ 'num-warning': stats.doingCount > 0 }">
            {{ stats.doingCount }}
          </text>
          <text class="stats-label">处理中</text>
        </view>
        <view class="stats-divider" />
        <view class="stats-item" @tap="onStatsTap('done')">
          <text class="stats-num num-success">{{ stats.doneCount }}</text>
          <text class="stats-label">已完结</text>
        </view>
      </view>

      <view class="filter-section" :class="{ 'is-expanded': filterExpanded }">
        <view class="filter-header" @tap="filterExpanded = !filterExpanded">
          <view class="filter-summary">
            <view class="filter-text-box">
              <text v-if="hasActiveFilter" class="filter-active-text">
                {{ getLevelLabel() }} · {{ getStatusLabel() }}
              </text>
              <text v-else class="filter-placeholder">全部工单</text>
            </view>
          </view>
          <view class="filter-arrow-wrap">
            <text class="filter-clear-link" v-if="hasActiveFilter" @tap.stop="() => { filterLevel = 'all'; filterStatus = 'all' }">重置</text>
            <view class="filter-arrow" :class="{ expanded: filterExpanded }"></view>
          </view>
        </view>

        <view v-if="filterExpanded" class="filter-body-wrapper">
          <view class="filter-body">
            <view class="filter-group">
              <view class="group-label">紧急程度</view>
              <view class="filter-pills">
                <view
                  v-for="opt in LEVEL_OPTS"
                  :key="opt.value"
                  class="pill"
                  :class="{ active: filterLevel === opt.value }"
                  :style="{
                    '--active-bg': opt.color || 'var(--primary)',
                    '--active-color': '#fff'
                  }"
                  @tap="filterLevel = opt.value as Level"
                >{{ opt.label }}</view>
              </view>
            </view>

            <view class="filter-group">
              <view class="group-label">工单状态</view>
              <view class="filter-pills">
                <view
                  v-for="opt in STATUS_OPTS"
                  :key="opt.value"
                  class="pill"
                  :class="{ active: filterStatus === opt.value }"
                  @tap="filterStatus = opt.value as Status"
                >{{ opt.label }}</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 仅列表区域纵向滚动（小程序需 scroll-view + 明确剩余高度） -->
    <scroll-view scroll-y class="list-scroll" :show-scrollbar="false" :enable-flex="true">
      <view v-if="loading" class="state-wrap">
        <view class="spinner" />
        <text class="state-text">数据加载中...</text>
      </view>

      <view v-else-if="filteredEvents.length === 0" class="state-wrap">
        <text class="empty-icon">📋</text>
        <text class="state-text">暂无任务</text>
      </view>

      <view v-else class="list">
        <view
          v-for="ev in filteredEvents"
          :key="ev.id"
          class="card"
          @tap="goDetail(ev.id)"
        >
          <view class="card-top">
            <text class="card-title">{{ ev.title }}</text>
            <view
              class="tag"
              :style="{
                color: STATUS_MAP[ev.status]?.color,
                background: STATUS_MAP[ev.status]?.bg,
              }"
            >
              {{ STATUS_MAP[ev.status]?.label }}
            </view>
          </view>

          <view class="card-body">
            <text class="location-icon">📍</text>
            <view class="location-info">
              <text v-if="ev.district || ev.street" class="location-region">
                {{ [ev.district, ev.street].filter(Boolean).join(' ') }}
              </text>
              <text v-if="ev.location" class="location-text">{{ ev.location }}</text>
              <text v-if="!ev.district && !ev.street && !ev.location" class="location-text location-empty">暂无位置信息</text>
            </view>
          </view>

          <view class="card-footer">
            <text class="time-text">{{ formatTime(ev.createdAt) }}</text>
            <view class="card-footer-tags">
              <view v-if="isSelfReported(ev)" class="self-tag">我上报</view>
              <view
                class="level-tag"
                :style="{
                  color: LEVEL_MAP[ev.level]?.color,
                  background: LEVEL_MAP[ev.level]?.bg,
                }"
              >
                {{ LEVEL_MAP[ev.level]?.label }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <app-tab-bar active="home" />
  </view>
</template>

<style lang="scss" scoped>
.page {
  height: 100%;
  box-sizing: border-box;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: calc(110rpx + env(safe-area-inset-bottom));
}

.orders-top {
  flex-shrink: 0;
  z-index: 10;
}

.list-scroll {
  flex: 1;
  height: 0;
  min-height: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  background: #ffffff;
  z-index: 10;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.header-title {
  font-size: 38rpx;
  font-weight: 700;
  color: #1e293b;
}

.header-sub {
  font-size: 24rpx;
  color: #64748b;
  margin-top: 6rpx;
  display: block;
}

.header-right {
  display: flex;
  gap: 16rpx;
  flex-shrink: 0;
  align-items: center;
}

.icon-btn {
  background: var(--input-bg);
  color: var(--text-sub);
  padding: 14rpx 28rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 600;
  transition: all 0.2s;
  flex-shrink: 0;
  white-space: nowrap;
  &:active { transform: scale(0.95); }
}

.logout-btn { color: #ef4444; background: #fff1f2; }
.report-btn { background: #3b82f6; color: #ffffff; }

.notify-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  background: var(--input-bg);
  border-radius: 16rpx;
  transition: transform 0.2s;
  flex-shrink: 0;
  &:active { transform: scale(0.95); }
}

.notify-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  background: #ef4444;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
  box-sizing: border-box;
}

.stats-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  // border-top: 1px solid #e0e0e0;
  // border-bottom: 1px solid #e0e0e0;
  // margin: 16rpx 32rpx 16rpx;
  // border-radius: 20rpx;
  padding: 24rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  &:active { opacity: 0.7; }
}

.stats-divider {
  width: 1rpx;
  height: 48rpx;
  background: #f1f5f9;
}

.stats-num {
  font-size: 48rpx;
  font-weight: 700;
  color: #94a3b8;
  line-height: 1;
}

.num-danger  { color: #ef4444; }
.num-warning { color: #f59e0b; }
.num-success { color: #10b981; }

.stats-label {
  font-size: 22rpx;
  color: #94a3b8;
}

/* 优化后的筛选区样式 */
.filter-section {
  background: #ffffff;
  margin: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1rpx solid #f1f5f9;

  &.is-expanded {
    box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.05);
  }
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 40rpx;
  height: 60rpx;
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.filter-icon {
  width: 48rpx;
  height: 48rpx;
  background: #f1f5f9;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  .emoji { font-size: 24rpx; }
}

.filter-placeholder {
  font-size: 28rpx;
  color: #94a3b8;
}

.filter-active-text {
  font-size: 26rpx;
  color: #3b82f6;
  font-weight: 600;
}

.filter-arrow-wrap {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.filter-clear-link {
  font-size: 24rpx;
  color: #94a3b8;
  padding: 10rpx;
}

.filter-arrow {
  width: 14rpx;
  height: 14rpx;
  border-right: 4rpx solid #cbd5e1;
  border-bottom: 4rpx solid #cbd5e1;
  transform: rotate(45deg);
  transition: all 0.3s;
  margin-top: -6rpx;
  &.expanded { transform: rotate(-135deg); margin-top: 6rpx; }
}

.filter-body-wrapper {
  background: #ffffff;
  border-top: 1rpx solid #f1f5f9;
  animation: slideDown 0.3s ease-out;
}

.filter-body {
  padding: 20rpx 40rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.group-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #94a3b8;
  width: 112rpx;
  flex-shrink: 0;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.pill {
  padding: 6rpx 20rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  background: #f1f5f9;
  color: #475569;
  transition: all 0.2s;
  border: 1rpx solid transparent;

  &.active {
    background: #dbeafe;
    color: #3b82f6;
    font-weight: 600;
  }

  &:active { transform: scale(0.95); }
}

/* 列表与卡片 */
.list { padding: 32rpx; display: flex; flex-direction: column; gap: 32rpx; }

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  border: 1rpx solid #f1f5f9;
  &:active { background: #f8fafc; }
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
  flex: 1;
  margin-right: 20rpx;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  font-weight: 700;
}

.card-body {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.location-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.location-region {
  font-size: 26rpx;
  color: #3b82f6;
  font-weight: 600;
}

.location-text {
  font-size: 26rpx;
  color: #64748b;
}

.location-empty {
  color: #cbd5e1;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24rpx;
  border-top: 1rpx solid #f1f5f9;
}

.time-text { font-size: 24rpx; color: #94a3b8; }
.card-footer-tags { display: flex; align-items: center; gap: 12rpx; }
.level-tag { font-size: 22rpx; font-weight: 600; padding: 4rpx 12rpx; border-radius: 6rpx; }
.self-tag { font-size: 22rpx; font-weight: 600; padding: 4rpx 12rpx; border-radius: 6rpx; color: #2563eb; background: #dbeafe; }


.state-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
  color: #94a3b8;
}

.spinner {
  width: 48rpx;
  height: 48rpx;
  border: 4rpx solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>