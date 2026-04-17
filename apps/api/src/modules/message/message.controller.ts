import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common'
import { MessageService } from './message.service'
import { JwtAuthGuard } from '@/modules/auth/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { ApiTags } from '@nestjs/swagger'

@UseGuards(JwtAuthGuard)
@ApiTags('message')
@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.messageService.findByTenant(user.tenantId, user.userId)
  }

  @Get('unread')
  unread(@CurrentUser() user: any) {
    return this.messageService.getUnreadCount(user.tenantId, user.userId)
  }

  @Post(':id/read')
  markRead(@Param('id') id: string) {
    return this.messageService.markRead(+id)
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.messageService.markAllRead(user.tenantId, user.userId)
  }
}
