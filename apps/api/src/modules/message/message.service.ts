import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from './message.entity'
import { MessageType } from '@/common/enums'
import { Event } from '@/modules/event/event.entity'

@Injectable()
export class MessageService {
  constructor(@InjectRepository(Message) private repo: Repository<Message>) {}

  /** KPI 等聚合统计使用：按 where 条件计数 */
  countByWhere(where: Partial<Message>) {
    return this.repo.count({ where })
  }

  private visibilityQb(tenantId: string, userId?: number) {
    return this.repo
      .createQueryBuilder('msg')
      .where('msg.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(msg.targetUserId IS NULL OR msg.targetUserId = :userId)',
        { userId: userId ?? 0 },
      )
  }

  private async unreadCountByType(tenantId: string, userId: number) {
    const rows = await this.visibilityQb(tenantId, userId)
      .andWhere('msg.isRead = false')
      .select('msg.type', 'type')
      .addSelect('COUNT(1)', 'count')
      .groupBy('msg.type')
      .getRawMany<{ type: MessageType; count: string }>()

    const typed = {
      alert: 0,
      dispatch: 0,
      complete: 0,
      system: 0,
      total: 0,
    }
    for (const row of rows) {
      const c = Number(row.count || 0)
      if (row.type in typed) {
        (typed as Record<string, number>)[row.type] = c
        typed.total += c
      }
    }
    return typed
  }

  async findByTenant(
    tenantId: string,
    userId: number,
    query?: { type?: MessageType; page?: number; pageSize?: number },
  ) {
    const page = Math.max(1, Number(query?.page || 1))
    const pageSize = Math.max(1, Math.min(100, Number(query?.pageSize || 20)))
    const baseQb = this.visibilityQb(tenantId, userId)

    if (query?.type) {
      baseQb.andWhere('msg.type = :type', { type: query.type })
    }

    const [list, total, unreadCount] = await Promise.all([
      baseQb
        .clone()
        .leftJoin(Event, 'ev', 'ev.id = msg.eventId')
        .select([
          'msg.id AS id',
          'msg.title AS title',
          'msg.content AS content',
          'msg.type AS type',
          'msg.isRead AS isRead',
          'msg.createdAt AS createdAt',
          'msg.eventId AS eventId',
          'ev.id AS relatedEventId',
          'ev.title AS relatedEventTitle',
        ])
        .orderBy('msg.createdAt', 'DESC')
        .skip((page - 1) * pageSize)
        .take(pageSize)
        .getRawMany(),
      baseQb.clone().getCount(),
      this.unreadCountByType(tenantId, userId),
    ])

    return {
      list: list.map((row: Record<string, unknown>) => ({
        id: Number(row.id),
        title: String(row.title ?? ''),
        content: String(row.content ?? ''),
        type: row.type,
        isRead: !!row.isRead,
        createdAt: row.createdAt,
        eventId: row.eventId != null ? Number(row.eventId) : null,
        relatedEventId: row.relatedEventId != null ? Number(row.relatedEventId) : null,
        relatedEventTitle: row.relatedEventTitle != null ? String(row.relatedEventTitle) : null,
      })),
      total,
      unreadCount,
    }
  }

  // 兼容旧调用：仍返回数组
  async findByTenantLegacy(tenantId: string, userId?: number) {
    return this.visibilityQb(tenantId, userId)
      .orderBy('msg.createdAt', 'DESC')
      .take(50)
      .getMany()
  }

  async getUnreadCount(tenantId: string, userId: number) {
    return this.unreadCountByType(tenantId, userId)
  }

  async markRead(id: number) {
    await this.repo.update(id, { isRead: true })
    return { success: true }
  }

  async markAllRead(tenantId: string, userId: number) {
    const res = await this.repo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('isRead = false')
      .andWhere(
        '(targetUserId IS NULL OR targetUserId = :userId)',
        { userId },
      )
      .execute()
    return { success: true, updatedCount: res.affected ?? 0 }
  }

  async markReadBatch(tenantId: string, userId: number, ids: number[]) {
    const qb = this.repo
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true })
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('(targetUserId IS NULL OR targetUserId = :userId)', { userId })
      .andWhere('isRead = false')

    if (ids.length > 0) {
      qb.andWhere('id IN (:...ids)', { ids })
    }

    const res = await qb.execute()
    return { success: true, updatedCount: res.affected ?? 0 }
  }

  create(dto: {
    title: string
    content: string
    type: MessageType
    tenantId: string
    targetUserId?: number
    eventId?: number
  }) {
    return this.repo.save(this.repo.create(dto))
  }
}
