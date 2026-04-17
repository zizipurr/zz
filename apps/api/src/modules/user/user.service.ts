import { Injectable, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import {
  formatJobNumber,
  JOB_NUMBER_REGISTER_NUMERIC_MAX,
  JOB_NUMBER_REGISTER_NUMERIC_MIN,
} from '@/common/constants/job-number'

/** 与注册接口一致：11 位中国大陆手机号 */
const CN_MOBILE_RE = /^1[3-9]\d{9}$/

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  findByUsername(username: string) {
    return this.repo.findOne({ where: { username } })
  }

  /** 登录账号：支持用户名或手机号（手机号与注册规则一致） */
  findByUsernameOrPhone(raw: string) {
    const login = raw.trim()
    if (!login) return Promise.resolve(null)
    if (CN_MOBILE_RE.test(login)) {
      return this.repo.findOne({ where: { phone: login } })
    }
    return this.repo.findOne({ where: { username: login } })
  }

  findById(id: number) {
    return this.repo.findOne({ where: { id } })
  }

  async bindOpenid(userId: number, openid: string) {
    await this.repo.update(userId, { openid })
  }

  create(data: Partial<User> & { username: string; password: string }) {
    return this.repo.save(this.repo.create(data))
  }

  /**
   * 小程序注册工号：前缀 GR- + 5 位数字，段 GR-10000～GR-19999（与种子 GR-0xxxx 区分），全局唯一。
   */
  async allocateNextRegistrationJobNumber(): Promise<string> {
    const raw = await this.repo
      .createQueryBuilder('user')
      .select('MAX(CAST(SUBSTRING(user.jobNumber, 4) AS UNSIGNED))', 'mx')
      .where('user.jobNumber REGEXP :pat', { pat: '^GR-1[0-9]{4}$' })
      .getRawOne<{ mx: string | null }>()

    const prev = raw?.mx != null && raw.mx !== '' ? Number(raw.mx) : JOB_NUMBER_REGISTER_NUMERIC_MIN - 1
    const next = prev + 1
    if (next < JOB_NUMBER_REGISTER_NUMERIC_MIN || next > JOB_NUMBER_REGISTER_NUMERIC_MAX) {
      throw new ConflictException('工号资源不足，请联系管理员')
    }
    return formatJobNumber(next)
  }

  findAll() {
    return this.repo.find()
  }

  findByRole(role: string) {
    return this.repo.find({ where: { role } })
  }

  findStaff(tenantId?: string) {
    const qb = this.repo.createQueryBuilder('user')
      .where('user.role = :role', { role: 'grid_staff' })
      .andWhere('user.status = :status', { status: 'active' })
      .select(['user.id', 'user.username', 'user.realName', 'user.nickname', 'user.district', 'user.tenantId'])
    if (tenantId) {
      qb.andWhere('user.tenantId = :tenantId', { tenantId })
    }
    return qb.getMany()
  }
}
