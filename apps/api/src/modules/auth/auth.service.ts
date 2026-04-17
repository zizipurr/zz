import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UserService } from '@/modules/user/user.service'
import { User } from '@/modules/user/user.entity'
import * as bcrypt from 'bcryptjs'
import { SECURITY_DEFAULTS } from '@/common/constants/security'
import { WechatService } from '@/modules/wechat/wechat.service'

export interface JwtPayload {
  sub: number
  username: string
  role: string
  tenantId: string | null
  district: string | null
  realName: string | null
}

/** 登录 / 资料接口返回给前端的用户字段（不含 password） */
export type PublicUserInfo = {
  id: number
  username: string
  nickname: string | null
  role: string
  tenantId: string | null
  district: string | null
  realName: string | null
  phone: string | null
  jobNumber: string | null
  status: string | null
}

export interface LoginResult {
  token: string
  user: PublicUserInfo
}

export interface RegisterResult {
  success: boolean
  message: string
  user: {
    id: number
    username: string
    realName: string | null
    phone: string | null
    role: string
    tenantId: string | null
    district: string | null
    jobNumber: string | null
  }
}

export interface RegisterDto {
  username: string
  password: string
  realName: string
  phone: string
  district: string
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private wechatService: WechatService,
  ) {}

  toPublicUser(user: User): PublicUserInfo {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname ?? null,
      role: user.role,
      tenantId: user.tenantId ?? null,
      district: user.district ?? null,
      realName: user.realName ?? null,
      phone: user.phone ?? null,
      jobNumber: user.jobNumber ?? null,
      status: user.status ?? null,
    }
  }

  /** 供 GET /auth/profile：从数据库拉全量展示字段（JWT 里不含工号等） */
  async getProfile(userId: number): Promise<PublicUserInfo> {
    const user = await this.userService.findById(userId)
    if (!user) throw new UnauthorizedException('用户不存在')
    return this.toPublicUser(user)
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userService.findByUsernameOrPhone(username)
    if (!user) throw new UnauthorizedException('用户不存在')
    const match = await bcrypt.compare(password, user.password)
    if (!match) throw new UnauthorizedException('密码错误')
    return user
  }

  async login(user: User, wxCode?: string): Promise<LoginResult> {
    // 小程序登录时尝试绑定 openid（失败不阻断登录）
    if (wxCode) {
      const openid = await this.wechatService.getOpenidByCode(wxCode)
      if (openid && openid !== user.openid) {
        await this.userService.bindOpenid(user.id, openid)
        user.openid = openid
      }
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId ?? null,
      district: user.district ?? null,
      realName: user.realName ?? null,
    }
    const token = this.jwtService.sign(payload)
    return {
      token,
      user: this.toPublicUser(user),
    }
  }

  async register(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.userService.findByUsername(dto.username)
    if (existing) throw new ConflictException('用户名已被占用')

    const hash = await bcrypt.hash(dto.password, SECURITY_DEFAULTS.BCRYPT_SALT_ROUNDS)
    const jobNumber = await this.userService.allocateNextRegistrationJobNumber()
    const user = await this.userService.create({
      username: dto.username,
      password: hash,
      realName: dto.realName,
      phone: dto.phone,
      district: dto.district,
      jobNumber,
      role: 'grid_staff',       // 前端不可传，固定为网格员
      tenantId: 'shenzhen',     // 演示阶段固定为深圳
      status: 'active',
    })
    return {
      success: true,
      message: '注册成功',
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName ?? null,
        phone: user.phone ?? null,
        role: user.role,
        tenantId: user.tenantId ?? null,
        district: user.district ?? null,
        jobNumber: user.jobNumber ?? jobNumber,
      },
    }
  }
}
