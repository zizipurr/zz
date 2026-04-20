import { Injectable } from '@nestjs/common'
import { Not } from 'typeorm'
import { EventService } from '@/modules/event/event.service'
import { MessageService } from '@/modules/message/message.service'
import { EventLevel, EventStatus } from '@/common/enums'
import { EventScene } from '@/modules/event/event.entity'

const TRAFFIC_TOTAL = 156

@Injectable()
export class KpiService {
  constructor(
    private eventService: EventService,
    private messageService: MessageService,
  ) {}

  async getSummary(tenantId?: string, scene?: EventScene) {
    const baseWhere: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(scene ? { scene } : {}),
    }

    const [total, pending, doing, done, unreadMsg] = await Promise.all([
      this.eventService.count(baseWhere),
      this.eventService.count({ ...baseWhere, status: EventStatus.PENDING }),
      this.eventService.count({ ...baseWhere, status: EventStatus.DOING }),
      this.eventService.count({ ...baseWhere, status: EventStatus.DONE }),
      this.messageService.countByWhere({ isRead: false }),
    ])

    const result: Record<string, any> = {
      nodes: 2847,
      lights: 15420,
      residents: 28614,
      traffic: TRAFFIC_TOTAL,
      sea: 12,
      alerts: pending + doing,
      events: { total, pending, doing, done },
      messages: { unread: unreadMsg },
    }

    // 交通场景：路口在线数 = 总数 - 活跃异常数
    if (scene === EventScene.TRAFFIC) {
      const trafficAnomaly = pending + doing
      result.trafficTotal = TRAFFIC_TOTAL
      result.trafficAnomaly = trafficAnomaly
      result.trafficOnline = TRAFFIC_TOTAL - trafficAnomaly
      result.trafficAnomalyLabel = trafficAnomaly > 0 ? `${trafficAnomaly}个异常` : '全部在线'
    }

    // 应急场景：各等级活跃告警数（用于等级分布图）
    if (scene === EventScene.EMERGENCY) {
      const [highLevel, midLevel, lowLevel] = await Promise.all([
        this.eventService.count({ ...baseWhere, level: EventLevel.HIGH, status: Not(EventStatus.DONE) }),
        this.eventService.count({ ...baseWhere, level: EventLevel.MID, status: Not(EventStatus.DONE) }),
        this.eventService.count({ ...baseWhere, level: EventLevel.LOW, status: Not(EventStatus.DONE) }),
      ])
      result.highLevel = highLevel
      result.midLevel = midLevel
      result.lowLevel = lowLevel
    }

    return result
  }
}
