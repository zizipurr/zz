import { defineStore } from 'pinia'
import { ref } from 'vue'
import { http } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'

export interface NotifyItem {
  id: number
  title: string
  location: string
  level: 'high' | 'mid' | 'low'
}

export const useNotifyStore = defineStore('notify', () => {
  const list = ref<NotifyItem[]>([])
  const unreadCount = ref(0)

  function addNotify(item: NotifyItem) {
    // 去重：同一事件ID重复推送不重复累计红点
    if (list.value.some((x) => x.id === item.id)) return
    list.value.unshift(item)
  }

  async function syncUnreadCount() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      unreadCount.value = 0
      return
    }
    try {
      const data = await http.get<{ count?: number }>('/events/stats/processing')
      unreadCount.value = Number(data?.count ?? 0)
    } catch {
      // 网络异常时保留当前红点，避免闪烁
    }
  }

  function clearNotify() {
    list.value = []
    unreadCount.value = 0
  }

  async function markAllRead() {
    const auth = useAuthStore()
    if (!auth.isLoggedIn) {
      unreadCount.value = 0
      return
    }
    try {
      await http.post('/messages/read-all')
      unreadCount.value = 0
    } catch {
      // 失败时回拉后端真值，避免本地状态偏差
      await syncUnreadCount()
    }
  }

  return { list, unreadCount, addNotify, clearNotify, markAllRead, syncUnreadCount }
})