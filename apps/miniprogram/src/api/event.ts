import { http } from '@/utils/request'

export interface StaffStats {
  completedCount: number
  reportedCount: number
  processingCount: number
  pendingCount: number
  completionRate: number
  month: string
}

export interface WorkorderStats {
  pendingCount: number
  doingCount: number
  doneCount: number
}

export function getMyStats() {
  return http.get<StaffStats>('/events/stats/my')
}

export function getWorkorderStats() {
  return http.get<WorkorderStats>('/events/stats/workorder')
}
