import { Module } from '@nestjs/common'
import { MockdevController } from './mockdev.controller'
import { EventModule } from '@/modules/event/event.module'
import { MessageModule } from '@/modules/message/message.module'

@Module({
  imports: [EventModule, MessageModule],
  controllers: [MockdevController],
})
export class MockdevModule {}
