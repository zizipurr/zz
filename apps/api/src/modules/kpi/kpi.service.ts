import { BadRequestException, Injectable } from '@nestjs/common'
import { Not } from 'typeorm'
import { EventService } from '@/modules/event/event.service'
import { MessageService } from '@/modules/message/message.service'
import { EventLevel, EventStatus } from '@/common/enums'
import { EventScene } from '@/modules/event/event.entity'

/**
 * KPI 常量兜底（待对接真实数据源）
 * 说明：这些字段目前无真实聚合来源，先由后端统一控制，前端禁止 hardcode。
 */
const KPI_FALLBACK = {
  overview: {
    gridNodes: 2847,
    lampNodes: 15420,
    residents: 28614,
    trafficCams: 156,
    emergencies: 12,
  },
  community: {
    residents: 28614,
    satisfaction: 96.8,
    slaAvgResponse: 28, // min
    slaTimeout: 2, // 件
    sla24hDoneRate: 91.2, // %
  },
  emergency: {
    avgResponse: 8.3, // min
    onlineStaff: 138, // 人
  },
  traffic: {
    trafficTotal: 156,
    congestionCount: 3,
    parkingRate: 73.5, // %
    todayFlow: 84.7, // 万辆
  },
  service: {
    onlineRate: 78.3, // %
    paymentCount: 326, // 笔
    hotlineRate: 99.1, // %
    satisfaction: 94.5, // %
  },
} as const

@Injectable()
export class KpiService {
  constructor(
    private eventService: EventService,
    private messageService: MessageService,
  ) {}

  private normalizeSceneKey(
    scene?: string,
  ): 'overview' | 'community' | 'emergency' | 'traffic' | 'service' {
    if (!scene) return 'overview'
    if (scene === 'overview') return 'overview'
    if (scene === 'community') return 'community'
    if (scene === 'emergency') return 'emergency'
    if (scene === 'traffic') return 'traffic'
    if (scene === 'service') return 'service'
    throw new BadRequestException('invalid scene, expected overview/community/emergency/traffic/service')
  }

  private toEventScene(sceneKey: 'overview' | 'community' | 'emergency' | 'traffic' | 'service'): EventScene | undefined {
    if (sceneKey === 'overview') return undefined
    if (sceneKey === 'community') return EventScene.COMMUNITY
    if (sceneKey === 'emergency') return EventScene.EMERGENCY
    if (sceneKey === 'traffic') return EventScene.TRAFFIC
    return EventScene.SERVICE
  }

  async getSummary(tenantId?: string, scene?: string) {
    const sceneKey = this.normalizeSceneKey(scene)
    const eventScene = this.toEventScene(sceneKey)
    const baseWhere: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(eventScene ? { scene: eventScene } : {}),
    }

    const [total, pendingTotal, processingTotal, doneTotal] =
      await Promise.all([
        this.eventService.count(baseWhere),
        this.eventService.count({ ...baseWhere, status: EventStatus.PENDING }),
        this.eventService.count({ ...baseWhere, status: EventStatus.DOING }),
        this.eventService.count({ ...baseWhere, status: EventStatus.DONE }),
      ])

    if (sceneKey === 'overview') {
      return {
        gridNodes: KPI_FALLBACK.overview.gridNodes,
        lampNodes: KPI_FALLBACK.overview.lampNodes,
        residents: KPI_FALLBACK.overview.residents,
        trafficCams: KPI_FALLBACK.overview.trafficCams,
        emergencies: KPI_FALLBACK.overview.emergencies,
        pendingTotal,
        processingTotal,
        doneTotal,
      }
    }

    if (sceneKey === 'community') {
      return {
        residents: KPI_FALLBACK.community.residents,
        todayReports: total,
        processing: processingTotal,
        done: doneTotal,
        satisfaction: KPI_FALLBACK.community.satisfaction, // 待对接真实数据源
        slaAvgResponse: KPI_FALLBACK.community.slaAvgResponse, // 待对接真实数据源
        slaTimeout: KPI_FALLBACK.community.slaTimeout, // 待对接真实数据源
        sla24hDoneRate: KPI_FALLBACK.community.sla24hDoneRate, // 待对接真实数据源
      }
    }

    if (sceneKey === 'emergency') {
      const [highLevel, midLevel, lowLevel] = await Promise.all([
        this.eventService.count({
          ...baseWhere,
          level: EventLevel.HIGH,
          status: Not(EventStatus.DONE),
        }),
        this.eventService.count({
          ...baseWhere,
          level: EventLevel.MID,
          status: Not(EventStatus.DONE),
        }),
        this.eventService.count({
          ...baseWhere,
          level: EventLevel.LOW,
          status: Not(EventStatus.DONE),
        }),
      ])

      const processing = processingTotal
      const doneRate = total > 0 ? +(doneTotal / total * 100).toFixed(1) : 0

      return {
        highLevel,
        midLevel,
        lowLevel,
        processing,
        doneRate, // %
        avgResponse: KPI_FALLBACK.emergency.avgResponse, // 待对接真实数据源
        onlineStaff: KPI_FALLBACK.emergency.onlineStaff, // 待对接真实数据源
      }
    }

    if (sceneKey === 'traffic') {
      // 异常量暂用事件活跃数近似（后续对接交通异常真实来源）
      const trafficAnomaly = pendingTotal + processingTotal
      const trafficTotal = KPI_FALLBACK.traffic.trafficTotal
      const trafficOnline = Math.max(0, trafficTotal - trafficAnomaly)

      return {
        trafficTotal, // 待对接真实数据源
        trafficOnline,
        trafficAnomaly,
        congestionCount: KPI_FALLBACK.traffic.congestionCount, // 待对接真实数据源
        parkingRate: KPI_FALLBACK.traffic.parkingRate, // 待对接真实数据源
        todayFlow: KPI_FALLBACK.traffic.todayFlow, // 待对接真实数据源
      }
    }

    // service
    return {
      todayOrders: total,
      onlineRate: KPI_FALLBACK.service.onlineRate, // 待对接真实数据源
      paymentCount: KPI_FALLBACK.service.paymentCount, // 待对接真实数据源
      hotlineRate: KPI_FALLBACK.service.hotlineRate, // 待对接真实数据源
      satisfaction: KPI_FALLBACK.service.satisfaction, // 待对接真实数据源
    }
  }
}
