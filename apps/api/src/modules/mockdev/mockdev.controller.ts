import { Controller, Post, Body } from '@nestjs/common'
import { EventLevel, EventStatus } from '@/common/enums'
import { EventService } from '@/modules/event/event.service'
import { MessageGateway } from '@/modules/message/message.gateway'

/**
 * 与 seed-demo.ts 中 DEMO_EVENTS 设计对齐：
 * - `district`：所属区县，列表/地图筛选依赖
 * - `location`：展示用详细点位，**必须以区县开头**，页面上可直接看出区域
 */
const MOCK_EVENTS: Array<{
  title: string
  level: EventLevel
  location: string
  tenantId: string
  district: string
}> = [
  // 深圳
  { title: '排水管网溢出预警', level: EventLevel.HIGH, location: '福田区 G-042', tenantId: 'shenzhen', district: '福田区' },
  { title: '社区入侵警报', level: EventLevel.HIGH, location: '福田区 C-019', tenantId: 'shenzhen', district: '福田区' },
  { title: '路灯故障', level: EventLevel.MID, location: '龙华区 L-0831', tenantId: 'shenzhen', district: '龙华区' },
  { title: '交通信号灯异常', level: EventLevel.MID, location: '福田区 T-087', tenantId: 'shenzhen', district: '福田区' },
  { title: '垃圾桶满载告警', level: EventLevel.LOW, location: '福田区 S-012', tenantId: 'shenzhen', district: '福田区' },
  { title: '消防通道占用', level: EventLevel.HIGH, location: '南山区 B-03', tenantId: 'shenzhen', district: '南山区' },
  { title: '电梯故障告警', level: EventLevel.MID, location: '龙华区 L-031', tenantId: 'shenzhen', district: '龙华区' },
  { title: '噪音扰民投诉', level: EventLevel.LOW, location: '宝安区 R-015', tenantId: 'shenzhen', district: '宝安区' },
  // 广州
  { title: '越秀区管道破裂', level: EventLevel.HIGH, location: '越秀区 Y-012', tenantId: 'guangzhou', district: '越秀区' },
  { title: '天河区路灯故障', level: EventLevel.MID, location: '天河区 T-031', tenantId: 'guangzhou', district: '天河区' },
  { title: '海珠区噪音投诉', level: EventLevel.LOW, location: '海珠区 H-008', tenantId: 'guangzhou', district: '海珠区' },
]

@Controller('mockdev')
export class MockdevController {
  constructor(
    private eventService: EventService,
    private gateway: MessageGateway,
  ) {}

  @Post('mock-event')
  async mockEvent(@Body() body: { index?: number }) {
    const idx = body.index ?? Math.floor(Math.random() * MOCK_EVENTS.length)
    const mock = MOCK_EVENTS[idx % MOCK_EVENTS.length]

    const event = await this.eventService.create({
      ...mock,
      status: EventStatus.PENDING,
    })

    this.gateway.server?.emit('event_updated', {
      type: 'new_event',
      event,
    })

    const levelLabel = event.level === 'high' ? '高危' : event.level === 'mid' ? '中危' : '低危'
    const region = event.district ? `【${event.district}】` : ''
    this.gateway.server?.emit('new_message', {
      title: `新告警：${event.title}`,
      content: `${region}${event.location} 发生${levelLabel}事件，请立即处置`,
    })

    return {
      success: true,
      message: `已创建事件：${event.title}`,
      event,
    }
  }

  @Post('reset-events')
  async resetEvents() {
    await this.eventService.resetAllToPending()
    this.gateway.server?.emit('event_updated', { type: 'reset' })
    return { success: true, message: '所有事件已重置为待处理' }
  }
}
