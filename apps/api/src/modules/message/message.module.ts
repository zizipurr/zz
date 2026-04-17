import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Message } from './message.entity'
import { MessageService } from './message.service'
import { MessageController } from './message.controller'
import { MessageGateway } from './message.gateway'

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  providers: [MessageService, MessageGateway],
  controllers: [MessageController],
  exports: [MessageService, MessageGateway],
})
export class MessageModule {}
