import 'reflect-metadata'
import * as bcrypt from 'bcryptjs'
import { AppDataSource } from '@/db/data-source'
import { User } from '@/modules/user/user.entity'
import { Event } from '@/modules/event/event.entity'
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
}

const DEMO_EVENTS: EventSeed[] = [
  // 深圳事件
  // { title: '排水管网溢出预警', location: '福田区 G-042',  level: EventLevel.HIGH, status: EventStatus.PENDING,    tenantId: 'shenzhen', district: '福田区' },
  // { title: '社区入侵警报',     location: '福田区 C-019', level: EventLevel.HIGH, status: STATUS_PROCESSING,     tenantId: 'shenzhen', district: '福田区' },
  // { title: '路灯故障',         location: '龙华区 L-0831', level: EventLevel.MID,  status: STATUS_PROCESSING,     tenantId: 'shenzhen', district: '龙华区' },
  // { title: '交通信号灯异常',   location: '福田区 T-087',  level: EventLevel.MID,  status: EventStatus.DONE,       tenantId: 'shenzhen', district: '福田区' },
  // { title: '垃圾桶满载告警',   location: '福田区 S-012',  level: EventLevel.LOW,  status: EventStatus.DONE,       tenantId: 'shenzhen', district: '福田区' },
  // { title: '消防通道占用',     location: '南山区 B-03',  level: EventLevel.HIGH, status: EventStatus.PENDING,    tenantId: 'shenzhen', district: '南山区' },
  // { title: '电梯故障告警',     location: '龙华区 L-031', level: EventLevel.MID,  status: EventStatus.PENDING,    tenantId: 'shenzhen', district: '龙华区' },
  // { title: '噪音扰民投诉',     location: '宝安区 R-015', level: EventLevel.LOW,  status: EventStatus.DONE,       tenantId: 'shenzhen', district: '宝安区' },
  // // 广州事件
  // { title: '越秀区管道破裂',   location: '越秀区 Y-012', level: EventLevel.HIGH, status: EventStatus.PENDING,    tenantId: 'guangzhou', district: '越秀区' },
  // { title: '天河区路灯故障',   location: '天河区 T-031', level: EventLevel.MID,  status: STATUS_PROCESSING,     tenantId: 'guangzhou', district: '天河区' },
  // { title: '海珠区噪音投诉',   location: '海珠区 H-008', level: EventLevel.LOW,  status: EventStatus.DONE,       tenantId: 'guangzhou', district: '海珠区' },
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
          tenantId: row.tenantId,
          district: row.district,
        }),
      )
      console.log(`📋 插入事件: ${row.title}`)
    }

    console.log('🧹 清空演示消息数据...')
    await messageRepo.createQueryBuilder().delete().from(Message).execute()

    const demoMessages = [
      { title: '系统初始化完成', content: '智城云系统已就绪，所有模块运行正常', type: MessageType.SYSTEM, tenantId: 'shenzhen', isRead: false },
      { title: '系统初始化完成', content: '广州市模块运行正常，数据同步完毕', type: MessageType.SYSTEM, tenantId: 'guangzhou', isRead: false },
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
