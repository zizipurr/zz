import { create } from 'zustand'
import request from '@/api/request'

interface EventItem {
  id: number; title: string; level: string; status: string
  location: string; assignee?: string; remark?: string; createdAt: string
}
interface EventState {
  events: EventItem[]
  loading: boolean
  selectedEvent: EventItem | null
  fetchEvents: (query?: { level?: string; status?: string }) => Promise<void>
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
    await get().fetchEvents()
  },
  complete: async (id) => {
    await request.post(`/events/${id}/complete`)
    await get().fetchEvents()
  },
  selectEvent: (event) => set({ selectedEvent: event }),
}))
