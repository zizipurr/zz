import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common'
import { EventService } from './event.service'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ApiTags } from '@nestjs/swagger'

/**
 * GET /events 需要 JWT。
 * super_admin 可通过 query 参数 tenantId 切换租户视角。
 * 写操作同样需要 JWT。
 */
@ApiTags('event')
@Controller('events')
export class EventController {
  constructor(private eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('level') level?: string,
    @Query('status') status?: string,
    @Query('tenantId') queryTenantId?: string,
  ) {
    // super_admin 传了具体 tenantId 时，以 tenant_admin 视角展示该租户数据
    const effectiveUser =
      user.role === 'super_admin' && queryTenantId
        ? { ...user, tenantId: queryTenantId, role: 'tenant_admin' }
        : user

    return this.eventService.findAll(effectiveUser, { level, status })
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/my')
  getMyStats(@CurrentUser() user: any) {
    return this.eventService.getStaffStats(user.userId, user.username, user.tenantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/processing')
  getProcessingCount(@CurrentUser() user: any) {
    return this.eventService.countProcessing(user.username, user.tenantId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/workorder')
  getWorkorderStats(@CurrentUser() user: any) {
    return this.eventService.getWorkorderStats(user)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findById(+id)
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.eventService.create(dto, user)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/dispatch')
  dispatch(@Param('id') id: string, @Body() body: { assignee: string; remark: string }) {
    return this.eventService.dispatch(+id, body.assignee, body.remark)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventService.complete(+id, user.username)
  }
}
