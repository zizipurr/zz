import { create } from 'zustand'
import request from '@/api/request'

interface EventItem {
  id: number; title: string; level: string; status: string
  location: string; assignee?: string; remark?: string; createdAt: string
  scene?: string
}
interface EventState {
  events: EventItem[]
  loading: boolean
  selectedEvent: EventItem | null
  fetchEvents: (query?: { level?: string; status?: string; scene?: string }) => Promise<void>
  dispatch: (id: number, assignee: string, remark: string) => Promise<void>
  complete: (id: number) => Promise<void>
  selectEvent: (event: EventItem | null) => void
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  loading: false,
  selectedEvent: null,
  fetchEvents: async (query) => {
    set({ loading: true })
    const { data } = await request.get('/events', { params: query })
    set({ events: data, loading: false })
  },
  dispatch: async (id, assignee, remark) => {
    await request.post(`/events/${id}/dispatch`, { assignee, remark })
    // refresh_events 由 useSceneData 监听，会携带正确的 scene 参数重新拉取 events + kpi
    // Dashboard 的监听器也会同步刷新消息列表
    window.dispatchEvent(new CustomEvent('refresh_events'))
  },
  complete: async (id) => {
    await request.post(`/events/${id}/complete`)
    window.dispatchEvent(new CustomEvent('refresh_events'))
  },
  selectEvent: (event) => set({ selectedEvent: event }),
}))
