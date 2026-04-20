import 'reflect-metadata'
import * as bcrypt from 'bcryptjs'
import { AppDataSource } from '@/db/data-source'
import { User } from '@/modules/user/user.entity'
import { Event, EventScene } from '@/modules/event/event.entity'
import { Message } from '@/modules/message/message.entity'
import { SECURITY_DEFAULTS } from '@/common/constants/security'
import { EventLevel, EventStatus, MessageType } from '@/common/enums'

/** 任务文案中的 processing 对应库内枚举 doing */
const STATUS_PROCESSING = EventStatus.DOING

interface AccountSeed {
  username: string
  password: string
  role: string
  tenantId?: string
  district?: string
  realName?: string
  phone?: string
  jobNumber?: string
  status?: string
}

/** 必要账号：任何环境都创建，存在则跳过 */
const REQUIRED_ACCOUNTS: AccountSeed[] = [
  {
    username: 'admin',
    password: 'admin',
    role: 'super_admin',
    tenantId: 'shenzhen',
    realName: '系统管理员',
    status: 'active',
  },
]

/** 演示账号：RUN_SEED=true 时创建，存在则跳过 */
const DEMO_ACCOUNTS: AccountSeed[] = [
  // 深圳市
  {
    username: 'sz_admin',
    password: 'admin',
    role: 'tenant_admin',
    tenantId: 'shenzhen',
    realName: '深圳市管理员',
    status: 'active',
  },
  {
    username: 'sz_grid_admin',
    password: '123456',
    role: 'grid_city_admin',
    tenantId: 'shenzhen',
    realName: '深圳市网格管理员',
    status: 'active',
  },
  {
    username: 'sz_supervisor_fukuda',
    password: '123456',
    role: 'grid_supervisor',
    tenantId: 'shenzhen',
    district: '福田区',
    realName: '福田区督导',
    status: 'active',
  },
  {
    username: 'grid_fukuda',
    password: '123456',
    role: 'grid_staff',
    tenantId: 'shenzhen',
    district: '福田区',
    realName: '张网格员',
    phone: '13800001111',
    jobNumber: 'GR-00001',
    status: 'active',
  },
  {
    username: 'grid_nanshan',
    password: '123456',
    role: 'grid_staff',
    tenantId: 'shenzhen',
    district: '南山区',
    realName: '李网格员',
    phone: '13800002222',
    jobNumber: 'GR-00002',
    status: 'active',
  },
  {
    username: 'grid_longhua',
    password: '123456',
    role: 'grid_staff',
    tenantId: 'shenzhen',
    district: '龙华区',
    realName: '王网格员',
    phone: '13800003333',
    jobNumber: 'GR-00003',
    status: 'active',
  },
  {
    username: 'grid_baoan',
    password: '123456',
    role: 'grid_staff',
    tenantId: 'shenzhen',
    district: '宝安区',
    realName: '陈网格员',
    phone: '13800004444',
    jobNumber: 'GR-00004',
    status: 'active',
  },
  // 广州市
  {
    username: 'gz_admin',
    password: 'admin',
    role: 'tenant_admin',
    tenantId: 'guangzhou',
    realName: '广州市管理员',
    status: 'active',
  },
  {
    username: 'gz_grid_yuexiu',
    password: '123456',
    role: 'grid_staff',
    tenantId: 'guangzhou',
    district: '越秀区',
    realName: '广州网格员A',
    phone: '13900001111',
    jobNumber: 'GR-00005',
    status: 'active',
  },
  {
    username: 'gz_grid_tianhe',
    password: '123456',
    role: 'grid_staff',
    tenantId: 'guangzhou',
    district: '天河区',
    realName: '广州网格员B',
    phone: '13900002222',
    jobNumber: 'GR-00006',
    status: 'active',
  },
]

interface EventSeed {
  title: string
  location: string
  level: EventLevel
  status: EventStatus
  tenantId: string
  district: string
  scene: EventScene
}

const DEMO_EVENTS: EventSeed[] = [
  // 每个场景各 2 条（按方案），用于 4/28 演示：四场景视角 + 指挥派单闭环
  // 社区场景
  { title: '南山区花园小区3栋电梯故障', scene: EventScene.COMMUNITY, level: EventLevel.MID,  district: '南山区', status: EventStatus.PENDING,    tenantId: 'shenzhen', location: '南山区 花园小区 3栋' },
  { title: '福田区美林小区管道漏水报修', scene: EventScene.COMMUNITY, level: EventLevel.LOW,  district: '福田区', status: STATUS_PROCESSING,     tenantId: 'shenzhen', location: '福田区 美林小区' },
  // 应急场景
  { title: '宝安区G-042排水管网溢出预警', scene: EventScene.EMERGENCY, level: EventLevel.HIGH, district: '宝安区', status: EventStatus.PENDING,    tenantId: 'shenzhen', location: '宝安区 G-042' },
  { title: '龙华区危化品运输异常告警',     scene: EventScene.EMERGENCY, level: EventLevel.HIGH, district: '龙华区', status: STATUS_PROCESSING,     tenantId: 'shenzhen', location: '龙华区 临时检查点' },
  // 交通场景
  { title: '福田区深南大道信号灯故障',     scene: EventScene.TRAFFIC,   level: EventLevel.MID,  district: '福田区', status: EventStatus.PENDING,    tenantId: 'shenzhen', location: '福田区 深南大道' },
  { title: '南山区滨海大道严重拥堵预警',   scene: EventScene.TRAFFIC,   level: EventLevel.LOW,  district: '南山区', status: STATUS_PROCESSING,     tenantId: 'shenzhen', location: '南山区 滨海大道' },
  // 城市服务
  { title: '龙华区政务中心热线响应超时',   scene: EventScene.SERVICE,   level: EventLevel.LOW,  district: '龙华区', status: EventStatus.PENDING,    tenantId: 'shenzhen', location: '龙华区 政务中心' },
  { title: '福田区水电缴费平台访问异常',   scene: EventScene.SERVICE,   level: EventLevel.MID,  district: '福田区', status: EventStatus.DONE,       tenantId: 'shenzhen', location: '福田区 民生缴费平台' },
  // 广州事件（用于验证租户隔离 & 演示多城市视角）
  { title: '越秀区中山五路社区入侵警报',   scene: EventScene.EMERGENCY, level: EventLevel.HIGH, district: '越秀区', status: EventStatus.PENDING,    tenantId: 'guangzhou', location: '越秀区 中山五路' },
  { title: '天河区智慧公寓电梯故障',       scene: EventScene.COMMUNITY, level: EventLevel.MID,  district: '天河区', status: STATUS_PROCESSING,     tenantId: 'guangzhou', location: '天河区 智慧公寓' },
  { title: '越秀区东风路信号灯异常',       scene: EventScene.TRAFFIC,   level: EventLevel.MID,  district: '越秀区', status: EventStatus.PENDING,    tenantId: 'guangzhou', location: '越秀区 东风路' },
  { title: '天河区政务服务热线超时',       scene: EventScene.SERVICE,   level: EventLevel.LOW,  district: '天河区', status: EventStatus.DONE,       tenantId: 'guangzhou', location: '天河区 政务服务中心' },
]

async function upsertAccount(userRepo: ReturnType<typeof AppDataSource.getRepository<User>>, account: AccountSeed) {
  const exists = await userRepo.findOne({ where: { username: account.username } })
  if (exists) {
    console.log(`⏭️  跳过已存在账号: ${account.username}`)
    return
  }
  const hash = await bcrypt.hash(account.password, SECURITY_DEFAULTS.BCRYPT_SALT_ROUNDS)
  await userRepo.save(
    userRepo.create({
      username: account.username,
      password: hash,
      role: account.role,
      tenantId: account.tenantId,
      district: account.district,
      realName: account.realName,
      phone: account.phone,
      jobNumber: account.jobNumber,
      status: account.status ?? 'active',
    }),
  )
  console.log(`👤 创建账号: ${account.username} (${account.role})`)
}

export async function seedDemo() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }
  console.log('✅ 数据库连接成功')

  const userRepo = AppDataSource.getRepository(User)
  const eventRepo = AppDataSource.getRepository(Event)
  const messageRepo = AppDataSource.getRepository(Message)

  console.log('🔒 必要数据：初始化管理员账号...')
  for (const account of REQUIRED_ACCOUNTS) {
    await upsertAccount(userRepo, account)
  }

  if (process.env.RUN_SEED) {
    console.log('🌱 演示数据：初始化演示账号...')
    for (const account of DEMO_ACCOUNTS) {
      await upsertAccount(userRepo, account)
    }

    console.log('🧹 清空演示事件数据...')
    await eventRepo.createQueryBuilder().delete().from(Event).execute()

    for (const row of DEMO_EVENTS) {
      await eventRepo.save(
        eventRepo.create({
          title: row.title,
          location: row.location,
          level: row.level,
          status: row.status,
          scene: row.scene,
          tenantId: row.tenantId,
          district: row.district,
        }),
      )
      console.log(`📋 插入事件: ${row.title}`)
    }

    console.log('🧹 清空演示消息数据...')
    await messageRepo.createQueryBuilder().delete().from(Message).execute()
    const savedEvents = await eventRepo.find()
    const pickBy = (tenantId: string, where: (e: Event) => boolean, fallback = 0) => {
      const list = savedEvents.filter((e) => e.tenantId === tenantId && where(e))
      return list.length > 0 ? list[0].id : (savedEvents.find((e) => e.tenantId === tenantId)?.id ?? fallback)
    }

    const demoMessages = [
      // alert（高危事件）
      { title: '高危告警：排水管网溢出', content: '宝安区 G-042 发生高危告警，请立即处置', type: MessageType.ALERT, tenantId: 'shenzhen', eventId: pickBy('shenzhen', (e) => e.level === EventLevel.HIGH), isRead: false },
      { title: '高危告警：危化运输异常', content: '龙华区 临时检查点告警升级，请复核', type: MessageType.ALERT, tenantId: 'shenzhen', eventId: pickBy('shenzhen', (e) => e.level === EventLevel.HIGH), isRead: true },
      { title: '高危告警：越秀区社区入侵', content: '越秀区中山五路监测到异常入侵，请关注', type: MessageType.ALERT, tenantId: 'guangzhou', eventId: pickBy('guangzhou', (e) => e.level === EventLevel.HIGH), isRead: false },

      // dispatch（已派单/处理中）
      { title: '已派单：美林小区漏水报修', content: '事件已派单给网格员，请跟进处理进度', type: MessageType.DISPATCH, tenantId: 'shenzhen', eventId: pickBy('shenzhen', (e) => e.status === EventStatus.DOING), isRead: false },
      { title: '已派单：滨海大道拥堵预警', content: '交通事件已转派处置，等待回传结果', type: MessageType.DISPATCH, tenantId: 'shenzhen', eventId: pickBy('shenzhen', (e) => e.status === EventStatus.DOING), isRead: true },
      { title: '已派单：天河区电梯故障', content: '社区事件已指派网格员，处置中', type: MessageType.DISPATCH, tenantId: 'guangzhou', eventId: pickBy('guangzhou', (e) => e.status === EventStatus.DOING), isRead: false },

      // complete（已完结）
      { title: '已完结：天河区服务热线超时', content: '事件已处置完结，进入归档', type: MessageType.COMPLETE, tenantId: 'guangzhou', eventId: pickBy('guangzhou', (e) => e.status === EventStatus.DONE), isRead: false },
      { title: '已完结：政务平台访问异常', content: '服务异常已恢复并关闭工单', type: MessageType.COMPLETE, tenantId: 'shenzhen', eventId: pickBy('shenzhen', (e) => e.status === EventStatus.DONE), isRead: true },
      { title: '已完结：市民热线工单', content: '热线工单已关闭，满意度已回收', type: MessageType.COMPLETE, tenantId: 'shenzhen', eventId: pickBy('shenzhen', () => true), isRead: false },

      // system（系统通知）
      { title: '系统维护通知', content: '今晚 23:30 将进行例行维护，预计 10 分钟', type: MessageType.SYSTEM, tenantId: 'shenzhen', isRead: false },
      { title: '系统初始化完成', content: '智城云系统已就绪，所有模块运行正常', type: MessageType.SYSTEM, tenantId: 'shenzhen', isRead: true },
      { title: '系统同步完成', content: '广州市模块数据同步完毕', type: MessageType.SYSTEM, tenantId: 'guangzhou', isRead: false },
    ]
    for (const msg of demoMessages) {
      await messageRepo.save(messageRepo.create(msg))
      console.log(`💬 插入消息: ${msg.title} (${msg.tenantId})`)
    }
  } else {
    console.log('ℹ️  跳过演示账号和事件（设置 RUN_SEED=true 以初始化演示数据）')
  }

  console.log('✅ 演示数据初始化完成！')
}

function isSeedDemoCliProcess() {
  const script = (process.argv[1] ?? '').replace(/\\/g, '/')
  return (
    script.endsWith('/seed-demo.ts') ||
    script.endsWith('/seed-demo.js') ||
    script.endsWith('seed-demo.ts') ||
    script.endsWith('seed-demo.js')
  )
}

/** 本地手动执行 `pnpm seed:demo` 时运行并在结束后关闭连接；由 main 调用 seedDemo 时不执行此块、且不销毁连接 */
if (isSeedDemoCliProcess()) {
  void (async () => {
    try {
      await seedDemo()
    } catch (err) {
      console.error(err)
      process.exitCode = 1
    } finally {
      if (AppDataSource.isInitialized) {
        await AppDataSource.destroy()
      }
    }
  })()
}
