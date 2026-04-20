import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { MessageService } from './message.service'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ApiTags } from '@nestjs/swagger'
import { MessageType } from '@/common/enums'

@UseGuards(JwtAuthGuard)
@ApiTags('message')
@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('type') type?: MessageType,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.messageService.findByTenant(user.tenantId, user.userId, {
      type,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    })
  }

  @Get('unread-count')
  unread(@CurrentUser() user: any) {
    return this.messageService.getUnreadCount(user.tenantId, user.userId)
  }

  // 兼容旧接口
  @Get('unread')
  async unreadLegacy(@CurrentUser() user: any) {
    const data = await this.messageService.getUnreadCount(user.tenantId, user.userId)
    return { count: data.total }
  }

  @Post(':id/read')
  markRead(@Param('id') id: string) {
    return this.messageService.markRead(+id)
  }

  @Patch('read')
  markReadBatch(
    @CurrentUser() user: any,
    @Body() body: { ids: number[] },
  ) {
    return this.messageService.markReadBatch(user.tenantId, user.userId, Array.isArray(body?.ids) ? body.ids : [])
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.messageService.markAllRead(user.tenantId, user.userId)
  }
}
