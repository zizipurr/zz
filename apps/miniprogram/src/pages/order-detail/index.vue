<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatDate } from '@/utils'
import { http } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import { requestSubscribe } from '@/utils/subscribe'

interface EventItem {
  id: number
  title: string
  level: string
  status: string
  location: string
  assignee?: string
  remark?: string
  createdAt: string
  updatedAt: string
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

const auth = useAuthStore()
const event = ref<EventItem | null>(null)
const loading = ref(true)
const remark = ref('')
const submitting = ref(false)
let eventId = 0

onLoad((options) => {
  eventId = Number(options?.id ?? 0)
  fetchEvent()
})

async function fetchEvent() {
  try {
    const data = await http.get<EventItem>(`/events/${eventId}`)
    event.value = data
  } finally {
    loading.value = false
  }
}

async function handleAccept() {
  submitting.value = true
  try {
    await http.post(`/events/${eventId}/dispatch`, {
      assignee: auth.user?.username ?? '网格员',
      remark: remark.value.trim(),
    } as Record<string, unknown>)
    uni.showToast({ title: '接单成功！', icon: 'none' })
    void requestSubscribe()
    await fetchEvent()
  } catch (err) {
    uni.showToast({
      title: err instanceof Error ? err.message : '操作失败',
      icon: 'none',
    })
  } finally {
    submitting.value = false
  }
}

async function handleComplete() {
  submitting.value = true
  try {
    await http.post(`/events/${eventId}/complete`)
    uni.showToast({ title: '处理完成！', icon: 'none' })
    void requestSubscribe()
    await fetchEvent()
  } catch (err) {
    uni.showToast({
      title: err instanceof Error ? err.message : '操作失败',
      icon: 'none',
    })
  } finally {
    submitting.value = false
  }
}

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <!-- 加载中 -->
  <view v-if="loading" class="center-state">
    <view class="spinner" />
    <text class="state-text">数据加载中...</text>
  </view>

  <!-- 不存在 -->
  <view v-else-if="!event" class="center-state">
    <text class="empty-icon">📭</text>
    <text class="state-text">工单不存在或已删除</text>
    <view class="btn-back-outline" @tap="handleBack">返回列表</view>
  </view>

  <!-- 正常内容 -->
  <view v-else class="page">
    <view class="body">
      <!-- 标题与状态 -->
      <view class="card">
        <text class="event-title">{{ event.title }}</text>
        <view class="tags">
          <view
            class="tag"
            :style="{
              color: LEVEL_MAP[event.level]?.color,
              background: LEVEL_MAP[event.level]?.bg,
            }"
          >
            {{ LEVEL_MAP[event.level]?.label }}
          </view>
          <view
            class="tag"
            :style="{
              color: STATUS_MAP[event.status]?.color,
              background: STATUS_MAP[event.status]?.bg,
            }"
          >
            {{ STATUS_MAP[event.status]?.label }}
          </view>
        </view>
      </view>

      <!-- 详情信息 -->
      <view class="card">
        <view class="info-row">
          <text class="info-label">任务位置</text>
          <text class="info-val">{{ event.location }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">上报时间</text>
          <text class="info-val">{{ formatDate(event.createdAt) }}</text>
        </view>
        <view v-if="event.assignee" class="info-row">
          <text class="info-label">处理人员</text>
          <text class="info-val">{{ event.assignee }}</text>
        </view>
        <view v-if="event.remark" class="info-row last">
          <text class="info-label">处理备注</text>
          <text class="info-val">{{ event.remark }}</text>
        </view>
      </view>

      <!-- 操作区 -->
      <view v-if="event.status !== 'done'" class="card">
        <view class="field-label">
          <text>处理备注</text>
        </view>
        <!-- textarea 同样需要 view 包裹提供边框样式 -->
        <view class="textarea-box">
          <textarea
            class="textarea"
            placeholder="请输入处理备注"
            placeholder-class="textarea-placeholder"
            :value="remark"
            @input="(e: any) => remark = e.detail.value"
          />
        </view>
        <view class="btns">
          <button
            v-if="event.status === 'pending'"
            class="btn btn-primary"
            :disabled="submitting"
            @tap="handleAccept"
          >
            {{ submitting ? '处理中...' : '接 单 处 理' }}
          </button>
          <button
            v-if="event.status === 'doing'"
            class="btn btn-success"
            :disabled="submitting"
            @tap="handleComplete"
          >
            {{ submitting ? '提交中...' : '完 成 任 务' }}
          </button>
        </view>
      </view>

      <!-- 已完成 -->
      <view v-if="event.status === 'done'" class="done-card">
        <view class="done-icon-wrap">
          <text class="done-icon">✓</text>
        </view>
        <text class="done-text">此任务已圆满完成</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
// 语义色：完成绿，不随主题变化
$primary-action: #10b981;

.center-state {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 32rpx;
}

.state-text {
  font-size: 30rpx;
}

.empty-icon {
  font-size: 96rpx;
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid var(--border-light);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: auraSpin 1s linear infinite;
}

.btn-back-outline {
  background: var(--card-bg);
  border: 2rpx solid var(--border-light);
  color: var(--text-sub);
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
}

.page {
  min-height: 100vh;
  background: var(--aura-bg);
}

.body {
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding-bottom: 80rpx;
}

.card {
  background: var(--card-bg);
  border-radius: 32rpx;
  padding: 40rpx;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--card-border);
  animation: auraFadeUp 0.5s cubic-bezier(0.2, 0, 0.2, 1);
}

.event-title {
  font-size: 40rpx;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.4;
  display: block;
  margin-bottom: 32rpx;
}

.tags {
  display: flex;
  gap: 20rpx;
}

.tag {
  font-size: 26rpx;
  font-weight: 600;
  padding: 12rpx 24rpx;
  border-radius: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 32rpx 0;
  border-bottom: 2rpx solid var(--border-light);

  &.last {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }
}

.info-label {
  font-size: 28rpx;
  color: var(--text-sub);
  flex-shrink: 0;
}

.info-val {
  font-size: 28rpx;
  color: var(--text-main);
  text-align: right;
  flex: 1;
  margin-left: 40rpx;
  font-weight: 500;
}

.textarea-box {
  width: 100%;
  background: var(--input-bg);
  border-radius: 24rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 40rpx;
  box-sizing: border-box;
}

.field-label {
  font-size: 28rpx;
  color: var(--text-main);
  font-weight: 600;
  margin-bottom: 16rpx;
}

.textarea {
  width: 100%;
  background: transparent;
  color: var(--text-main);
  font-size: 30rpx;
  height: 200rpx;
}

.textarea-placeholder {
  color: var(--text-muted);
}

.btns {
  display: flex;
  gap: 24rpx;
}

.btn {
  flex: 1;
  padding: 16rpx;
  border: none;
  border-radius: 999rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  transition: transform 0.2s;

  &[disabled] { opacity: 0.6; }
  &:active { transform: scale(0.97); }
}

.btn-primary {
  background: var(--primary-gradient);
  box-shadow: 0 12rpx 32rpx rgba(52, 130, 255, 0.25);
}

.btn-success {
  background: $primary-action;
  box-shadow: 0 12rpx 32rpx rgba(16, 185, 129, 0.25);
}

.done-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24rpx;
  background: #f0fdf4;
  border-radius: 32rpx;
  padding: 64rpx;
}

.done-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  background: $primary-action;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.3);
}

.done-icon {
  color: #fff;
  font-size: 48rpx;
  font-weight: bold;
}

.done-text {
  color: #166534;
  font-size: 32rpx;
  font-weight: 600;
}
</style>
