import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { UserService } from './user.service'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'

@ApiTags('user')
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll(@Query('role') role?: string) {
    if (role) return this.userService.findByRole(role)
    return this.userService.findAll()
  }

  // 按租户获取网格员列表（大屏派单用）
  // super_admin 可通过 query 参数 tenantId 指定租户，其他角色只看本租户
  @Get('staff')
  findStaff(
    @CurrentUser() user: any,
    @Query('tenantId') tenantId?: string | string[],
  ) {
    const normalizedTenantId =
      typeof tenantId === 'string'
        ? tenantId.split(',')[0]?.trim() || undefined
        : Array.isArray(tenantId)
          ? (tenantId.find((v) => typeof v === 'string' && v.trim())?.trim() || undefined)
          : undefined

    const effectiveTenantId = user.role === 'super_admin'
      ? normalizedTenantId
      : user.tenantId
    return this.userService.findStaff(effectiveTenantId)
  }
}
