import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { KpiService } from './kpi.service'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('kpi')
@Controller('kpi')
export class KpiController {
  constructor(private kpiService: KpiService) {}

  @UseGuards(JwtAuthGuard)
  @Get('summary')
  summary(
    @CurrentUser() user: any,
    @Query('tenantId') queryTenantId?: string,
  ) {
    // super_admin 可指定 tenantId 切换视角；其他角色用自己的 tenantId
    const effectiveTenantId =
      user.role === 'super_admin'
        ? queryTenantId  // undefined 表示全局汇总，具体值表示某城市
        : user.tenantId  // 非 super_admin 只能看自己租户

    return this.kpiService.getSummary(effectiveTenantId)
  }
}
