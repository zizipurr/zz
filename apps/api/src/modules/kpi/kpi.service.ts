import { Injectable } from '@nestjs/common'
import { EventService } from '@/modules/event/event.service'
import { MessageService } from '@/modules/message/message.service'
import { EventStatus } from '@/common/enums'

@Injectable()
export class KpiService {
  constructor(
    private eventService: EventService,
    private messageService: MessageService,
  ) {}

  async getSummary(tenantId?: string) {
    // 若指定了租户，事件统计只计该租户的数据
    const baseWhere: any = tenantId ? { tenantId } : {}

    const [total, pending, doing, done, unreadMsg] = await Promise.all([
      this.eventService.count(baseWhere),
      this.eventService.count({ ...baseWhere, status: EventStatus.PENDING }),
      this.eventService.count({ ...baseWhere, status: EventStatus.DOING }),
      this.eventService.count({ ...baseWhere, status: EventStatus.DONE }),
      this.messageService.countByWhere({ isRead: false }),
    ])
    return {
      nodes: 2847,
      lights: 15420,
      residents: 28614,
      traffic: 156,
      sea: 12,
      alerts: pending + doing,
      events: { total, pending, doing, done },
      messages: { unread: unreadMsg },
    }
  }
}
