import { Module } from '@nestjs/common'
import { KpiService } from './kpi.service'
import { KpiController } from './kpi.controller'
import { EventModule } from '@/modules/event/event.module'
import { MessageModule } from '@/modules/message/message.module'

@Module({
  imports: [EventModule, MessageModule],
  providers: [KpiService],
  controllers: [KpiController],
})
export class KpiModule {}
