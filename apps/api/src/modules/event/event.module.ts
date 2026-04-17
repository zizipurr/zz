import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Event } from './event.entity'
import { EventService } from './event.service'
import { EventController } from './event.controller'
import { MessageModule } from '@/modules/message/message.module'
import { UserModule } from '@/modules/user/user.module'

@Module({
  imports: [TypeOrmModule.forFeature([Event]), MessageModule, UserModule],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
