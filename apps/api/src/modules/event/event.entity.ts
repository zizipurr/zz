import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { EventLevel, EventStatus } from '@/common/enums'

export enum EventScene {
  IOC = 'ioc',
  COMMUNITY = 'community',
  EMERGENCY = 'emergency',
  TRAFFIC = 'traffic',
  SERVICE = 'service',
}

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

  @Column({ nullable: true })
  dispatcher: string // 派单人

  @Column({ type: 'datetime', nullable: true })
  dispatchedAt: Date // 派单时间

  @Column({ type: 'datetime', nullable: true })
  startedAt: Date // 接单处理时间

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date // 完结时间

  @Column({ type: 'text', nullable: true })
  completionResult: string // 处置结果备注

  @Column({
    type: 'enum',
    enum: EventScene,
    default: EventScene.IOC,
  })
  scene: EventScene

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}