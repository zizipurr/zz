import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'
import { MessageType } from '@/common/enums'

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column({ type: 'text' })
  content: string

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.SYSTEM,
  })
  type: MessageType

  @Column({ nullable: true })
  tenantId: string          // 租户隔离

  @Column({ nullable: true })
  targetUserId: number      // 目标用户ID，null 表示全租户可见

  @Column({ nullable: true })
  eventId: number           // 关联事件ID

  @Column({ nullable: true })
  userId: number            // 保留兼容旧数据，新消息不写此字段

  @Column({ default: false })
  isRead: boolean

  @CreateDateColumn()
  createdAt: Date
}
