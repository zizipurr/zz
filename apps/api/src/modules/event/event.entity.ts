import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { EventLevel, EventStatus } from '@/common/enums'

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  title: string

  @Column({
    type: 'enum',
    enum: EventLevel,
  })
  level: EventLevel

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus

  @Column({ nullable: true })
  location: string

  @Column({ nullable: true })
  street: string // 所属街道

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lat: number // 纬度

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  lng: number // 经度

  @Column({ nullable: true })
  assignee: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string

  @Column({ nullable: true })
  tenantId: string // 租户ID，从上报人自动带入

  @Column({ nullable: true })
  district: string // 所属区县，从上报人自动带入

  @Column({ nullable: true })
  reporterId: number // 上报人ID

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}