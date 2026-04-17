import { create } from 'zustand'
import request from '@/api/request'

/** 与 GET /kpi/summary 返回一致 */
export interface KpiSummary {
  nodes: number
  lights: number
  residents: number
  traffic: number
  sea: number
  alerts: number
  events?: { total: number; pending: number; doing: number; done: number }
  messages?: { unread: number }
}

const emptyKpi: KpiSummary = {
  nodes: 0,
  lights: 0,
  residents: 0,
  traffic: 0,
  sea: 0,
  alerts: 0,
}

interface KpiState {
  kpi: KpiSummary
  loading: boolean
  fetchKpi: () => Promise<void>
}

export const useKpiStore = create<KpiState>((set) => ({
  kpi: emptyKpi,
  loading: false,
  fetchKpi: async () => {
    set({ loading: true })
    try {
      const { data } = await request.get<KpiSummary>('/kpi/summary')
      set({ kpi: { ...emptyKpi, ...data }, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
