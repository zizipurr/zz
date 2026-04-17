import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  username: string

  @Column()
  password: string

  @Column({
    type: 'enum',
    enum: [
      'super_admin',
      'tenant_admin',
      'grid_city_admin',
      'grid_supervisor',
      'grid_staff',
      'community_manager',
      'community_staff',
      'community_owner',
      'emergency_commander',
      'emergency_responder',
      'traffic_manager',
      'traffic_operator',
    ],
    default: 'grid_staff',
  })
  role: string

  @Column({ nullable: true })
  nickname: string // 展示姓名/昵称

  @Column({ nullable: true })
  openid: string // 微信用户的 openid，登录时写入

  @Column({ nullable: true })
  tenantId: string // 租户ID：'shenzhen' | 'guangzhou'

  @Column({ nullable: true })
  district: string // 区县：'福田区' | '南山区' 等

  @Column({ nullable: true })
  realName: string // 真实姓名

  @Column({ nullable: true })
  phone: string // 手机号

  @Column({ nullable: true })
  jobNumber: string // 工号

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'disabled'],
    default: 'active',
    nullable: true,
  })
  status: string // 账号状态

  @CreateDateColumn()
  createdAt: Date
}
