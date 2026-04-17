import { EventStatus, EventLevel, MessageType } from '@/common/enums'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThanOrEqual } from 'typeorm'
import { Event } from './event.entity'
import { MessageGateway } from '@/modules/message/message.gateway'
import { MessageService } from '@/modules/message/message.service'
import { UserService } from '@/modules/user/user.service'

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private repo: Repository<Event>,
    private messageGateway: MessageGateway,
    private messageService: MessageService,
    private userService: UserService,
  ) {}

  findAll(user?: any, query?: { level?: string; status?: string }) {
    const qb = this.repo.createQueryBuilder('event')
      .orderBy('event.createdAt', 'DESC')

    // 按 level/status 过滤（保留原有功能）
    if (query?.level) qb.andWhere('event.level = :level', { level: query.level })
    if (query?.status) qb.andWhere('event.status = :status', { status: query.status })

    // 没有 user 时返回全部（兼容 KPI 等无 user 上下文的调用）
    if (!user) return qb.getMany()

    // super_admin 看全部
    if (user.role === 'super_admin') return qb.getMany()

    // tenant_admin 看本租户全部
    if (user.role === 'tenant_admin') {
      return qb
        .andWhere('event.tenantId = :tenantId', { tenantId: user.tenantId })
        .getMany()
    }

    // grid_city_admin 看本租户所有区域
    if (user.role === 'grid_city_admin') {
      return qb
        .andWhere('event.tenantId = :tenantId', { tenantId: user.tenantId })
        .getMany()
    }

    // grid_supervisor：可看本区县全部任务（含已指派给他人的）
    if (user.role === 'grid_supervisor') {
      return qb
        .andWhere('event.tenantId = :tenantId', { tenantId: user.tenantId })
        .andWhere('event.district = :district', { district: user.district })
        .getMany()
    }

    // grid_staff：仅看“指派给自己”或“未指派且本区县”
    // 已指派给他人的任务不展示，避免同区多人重复看到同一工单
    if (user.role === 'grid_staff') {
      return qb
        .andWhere('event.tenantId = :tenantId', { tenantId: user.tenantId })
        .andWhere(
          `(event.assignee = :username OR ((event.assignee IS NULL OR event.assignee = '') AND event.district = :district))`,
          { district: user.district, username: user.username },
        )
        .getMany()
    }

    // 其他角色默认看本租户
    return qb
      .andWhere('event.tenantId = :tenantId', { tenantId: user.tenantId })
      .getMany()
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } })
  }

  async create(dto: any, user?: any): Promise<Event> {
    const entity = this.repo.create({
      ...dto,
      tenantId: dto.tenantId || user?.tenantId || 'shenzhen',
      district: dto.district || user?.district,
      reporterId: user?.userId,
    })
    const saved = await this.repo.save(entity)
    const event = Array.isArray(saved) ? saved[0] : saved
    this.messageGateway.server?.emit('event_updated', { type: 'new_event', event })

    // 高危/中危写告警消息
    if (event.level === EventLevel.HIGH || event.level === EventLevel.MID) {
      const levelLabel = event.level === EventLevel.HIGH ? '高危' : '中危'
      this.messageService.create({
        title: `新${levelLabel}事件：${event.title}`,
        content: `${event.district || ''}${event.district ? ' ' : ''}${event.location || ''} 发生${levelLabel}事件，请关注`,
        type: MessageType.ALERT,
        tenantId: event.tenantId,
        eventId: event.id,
      }).catch(() => {})
      this.messageGateway.server?.emit('new_message', { type: 'alert' })
    }

    return event
  }

  async resetAllToPending() {
    await this.repo
      .createQueryBuilder()
      .update(Event)
      .set({
        status: EventStatus.PENDING,
        assignee: null,
        remark: null,
      })
      .execute()
    return { success: true }
  }

  async dispatch(id: number, assignee: string, remark: string) {
    await this.repo.update(id, { assignee, remark, status: EventStatus.DOING })

    // 状态变更广播给所有客户端（大屏/列表刷新用）
    this.messageGateway.server?.emit('event_updated', { type: 'status_change', id, status: EventStatus.DOING })

    const event = await this.findById(id)
    const user = await this.userService.findByUsername(assignee)

    // 写派单消息（租户广播）
    this.messageService.create({
      title: `已派单：${event?.title}`,
      content: `事件已派单给 ${user?.realName || assignee}，请跟进进度`,
      type: MessageType.DISPATCH,
      tenantId: event?.tenantId,
      eventId: id,
    }).catch(() => {})
    this.messageGateway.server?.emit('new_message', { type: 'dispatch' })

    if (event && user) {
      // Socket 派单通知只推给被派单的人
      this.messageGateway.sendToUser(user.id, {
        type: 'dispatch',
        id: event.id,
        title: event.title,
        location: event.location,
        level: event.level,
      })
    }

    return event
  }

  async complete(id: number, completerUsername?: string) {
    const event = await this.findById(id)
    const update: Partial<Event> = { status: EventStatus.DONE }
    // 若事件还没有 assignee（未经派单直接完结），记录完结人
    if (completerUsername && !event?.assignee) {
      update.assignee = completerUsername
    }
    await this.repo.update(id, update)
    this.messageGateway.server?.emit('event_updated', { id, status: EventStatus.DONE })

    // 写完结消息（租户广播）
    if (event) {
      this.messageService.create({
        title: `已完结：${event.title}`,
        content: `事件「${event.title}」已处置完结`,
        type: MessageType.COMPLETE,
        tenantId: event.tenantId,
        eventId: id,
      }).catch(() => {})
      this.messageGateway.server?.emit('new_message', { type: 'complete' })
    }

    return this.findById(id)
  }

  async getStaffStats(userId: number, username: string, tenantId: string) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [completedCount, reportedCount, processingCount, pendingCount, totalAssigned] =
      await Promise.all([
        // 本月处置完结（assignee=username, done, updatedAt >= 月初）
        this.repo.count({
          where: { assignee: username, status: EventStatus.DONE, tenantId, updatedAt: MoreThanOrEqual(startOfMonth) },
        }),
        // 本月上报（reporterId=userId, createdAt >= 月初）
        this.repo.count({
          where: { reporterId: userId, tenantId, createdAt: MoreThanOrEqual(startOfMonth) },
        }),
        // 处理中
        this.repo.count({
          where: { assignee: username, status: EventStatus.DOING, tenantId },
        }),
        // 待处理
        this.repo.count({
          where: { assignee: username, status: EventStatus.PENDING, tenantId },
        }),
        // 本月总派单数
        this.repo.count({
          where: { assignee: username, tenantId, createdAt: MoreThanOrEqual(startOfMonth) },
        }),
      ])

    const completionRate = totalAssigned > 0
      ? Math.round((completedCount / totalAssigned) * 100)
      : 0

    return {
      completedCount,
      reportedCount,
      processingCount,
      pendingCount,
      completionRate,
      month: `${now.getFullYear()}年${now.getMonth() + 1}月`,
    }
  }

  async countProcessing(username: string, tenantId: string) {
    const count = await this.repo.count({
      where: { assignee: username, status: EventStatus.DOING, tenantId },
    })
    return { count }
  }

  async getWorkorderStats(user: any) {
    const { role, tenantId, district, username, userId } = user

    if (role === 'grid_staff') {
      // 与 findAll(grid_staff) 保持同口径：
      // 可见范围 = 指派给自己 OR 未指派且本区县
      const visibleExpr =
        "(event.assignee = :assignee OR ((event.assignee IS NULL OR event.assignee = '') AND event.district = :district))"

      const [pendingCount, doingCount, doneCount] = await Promise.all([
        this.repo
          .createQueryBuilder('event')
          .where('event.tenantId = :tenantId', { tenantId })
          .andWhere('event.status = :status', { status: EventStatus.PENDING })
          .andWhere(visibleExpr, { assignee: username, district })
          .getCount(),
        this.repo
          .createQueryBuilder('event')
          .where('event.tenantId = :tenantId', { tenantId })
          .andWhere('event.status = :status', { status: EventStatus.DOING })
          .andWhere(visibleExpr, { assignee: username, district })
          .getCount(),
        this.repo.createQueryBuilder('event')
          .where('event.tenantId = :tenantId', { tenantId })
          .andWhere('event.status = :status', { status: EventStatus.DONE })
          .andWhere(visibleExpr, { assignee: username, district })
          .getCount(),
      ])
      return { pendingCount, doingCount, doneCount }
    }

    if (role === 'grid_supervisor') {
      const [pendingCount, doingCount, doneCount] = await Promise.all([
        this.repo.count({ where: { tenantId, district, status: EventStatus.PENDING } }),
        this.repo.count({ where: { tenantId, district, status: EventStatus.DOING } }),
        this.repo.count({ where: { tenantId, district, status: EventStatus.DONE } }),
      ])
      return { pendingCount, doingCount, doneCount }
    }

    // grid_city_admin / tenant_admin / super_admin：全租户
    const [pendingCount, doingCount, doneCount] = await Promise.all([
      this.repo.count({ where: { tenantId, status: EventStatus.PENDING } }),
      this.repo.count({ where: { tenantId, status: EventStatus.DOING } }),
      this.repo.count({ where: { tenantId, status: EventStatus.DONE } }),
    ])
    return { pendingCount, doingCount, doneCount }
  }

  count(where: any) {
    return this.repo.count({ where })
  }
}
