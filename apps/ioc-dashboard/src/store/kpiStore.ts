import { create } from 'zustand'
import request from '@/api/request'

/** 与 GET /kpi/summary 返回一致 */
export interface KpiSummary {
  // overview
  gridNodes?: number
  lampNodes?: number
  residents?: number
  trafficCams?: number
  emergencies?: number
  pendingTotal?: number
  processingTotal?: number
  doneTotal?: number

  // community
  todayReports?: number
  processing?: number
  done?: number
  satisfaction?: number
  slaAvgResponse?: number
  slaTimeout?: number
  sla24hDoneRate?: number

  // emergency
  highLevel?: number
  midLevel?: number
  lowLevel?: number
  doneRate?: number
  avgResponse?: number
  onlineStaff?: number

  // traffic
  trafficTotal?: number
  trafficAnomaly?: number
  trafficOnline?: number

  congestionCount?: number
  parkingRate?: number
  todayFlow?: number

  // service
  todayOrders?: number
  onlineRate?: number
  paymentCount?: number
  hotlineRate?: number
}

const emptyKpi: KpiSummary = {}

interface KpiState {
  kpi: KpiSummary
  loading: boolean
  fetchKpi: (opts?: { scene?: string }) => Promise<void>
}

export const useKpiStore = create<KpiState>((set) => ({
  kpi: emptyKpi,
  loading: false,
  fetchKpi: async (opts) => {
    set({ loading: true, kpi: emptyKpi })
    try {
      const { data } = await request.get<KpiSummary>('/kpi/summary', { params: opts })
      set({ kpi: { ...emptyKpi, ...data }, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
