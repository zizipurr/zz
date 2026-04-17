import { onMounted, onUnmounted } from 'vue'
import { useSocket } from './useSocket'
import { useNotifyStore } from '@/stores/notify'
import { useAuthStore } from '@/stores/auth'

export function useEventNotify() {
  const { socket, on, off } = useSocket()
  const notifyStore = useNotifyStore()
  const auth = useAuthStore()

  function canCurrentUserSeeEvent(event: any) {
    const user = auth.userInfo
    if (!user) return false

    // 租户隔离：super_admin 放行，其他角色仅本租户
    if (user.role !== 'super_admin' && event.tenantId && user.tenantId && event.tenantId !== user.tenantId) {
      return false
    }

    // 角色可见性：与事件列表保持一致
    if (user.role === 'grid_staff' || user.role === 'grid_supervisor') {
      return (
        event.district === user.district ||
        event.reporterId === user.id ||
        event.assignee === user.username
      )
    }

    // tenant_admin / grid_city_admin / super_admin：租户内全量可见
    return true
  }

  function handleEventUpdated(data: any) {
    if (data.type === 'new_event') {
      const event = data.event
      if ((event.level === 'high' || event.level === 'mid') && canCurrentUserSeeEvent(event)) {
        uni.vibrateShort({ type: 'heavy' })
        notifyStore.addNotify({
          id: event.id,
          title: event.title,
          location: event.location,
          level: event.level,
        })
        uni.showToast({
          title: `${event.level === 'high' ? '⚠ 高危' : '⚠ 中危'}：${event.title}`,
          icon: 'none',
          duration: 3000,
        })
        void notifyStore.syncUnreadCount()
      }
    }

    if (data.type === 'reset') {
      notifyStore.clearNotify()
      void notifyStore.syncUnreadCount()
    }
  }

  // 派单定向推送走 new_message 事件（sendToUser 只发给当前用户）
  function handleNewMessage(data: any) {
    // 后端有租户广播占位包（仅 { type: 'dispatch' }），这里忽略，避免错误累计
    if (!data || data.type !== 'dispatch' || !data.id || !data.title) return

    if (data.type === 'dispatch') {
      uni.vibrateShort({ type: 'heavy' })
      notifyStore.addNotify({
        id: data.id,
        title: data.title || '新任务派单',
        location: data.location || '',
        level: data.level || 'mid',
      })
      uni.showToast({
        title: `📋 新任务：${data.title}`,
        icon: 'none',
        duration: 3000,
      })
      void notifyStore.syncUnreadCount()
    }
  }

  function startListen() {
    // 先移除旧监听，防止来回切页面时重复注册
    off('event_updated', handleEventUpdated)
    off('new_message', handleNewMessage)
    on('event_updated', handleEventUpdated)
    on('new_message', handleNewMessage)
  }

  function stopListen() {
    off('event_updated', handleEventUpdated)
    off('new_message', handleNewMessage)
  }

  return { startListen, stopListen }
}