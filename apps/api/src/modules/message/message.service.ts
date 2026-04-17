import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Message } from './message.entity'
import { MessageType } from '@/common/enums'

@Injectable()
export class MessageService {
  constructor(@InjectRepository(Message) private repo: Repository<Message>) {}

  /** KPI 等聚合统计使用：按 where 条件计数 */
  countByWhere(where: Partial<Message>) {
    return this.repo.count({ where })
  }

  findByTenant(tenantId: string, userId?: number) {
    return this.repo
      .createQueryBuilder('msg')
      .where('msg.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(msg.targetUserId IS NULL OR msg.targetUserId = :userId)',
        { userId: userId ?? 0 },
      )
      .orderBy('msg.createdAt', 'DESC')
      .take(50)
      .getMany()
  }

  async getUnreadCount(tenantId: string, userId: number) {
    const count = await this.repo
      .createQueryBuilder('msg')
      .where('msg.tenantId = :tenantId', { tenantId })
      .andWhere('msg.isRead = false')
      .andWhere(
        '(msg.targetUserId IS NULL OR msg.targetUserId = :userId)',
        { userId },
      )
      .getCount()
    return { count }
  }

  async markRead(id: number) {
    await this.repo.update(id, { isRead: true })
    return { success: true }
  }

  async markAllRead(tenantId: string, userId: number) {
    await this.repo
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
    return { success: true }
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
