import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { EventLevel } from '@/common/enums'
import { EventScene } from './event.entity'

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsEnum(EventLevel)
  level: EventLevel

  @IsOptional()
  @IsString()
  location?: string

  @IsOptional()
  @IsString()
  tenantId?: string

  @IsOptional()
  @IsString()
  district?: string

  @IsOptional()
  @IsEnum(EventScene)
  scene?: EventScene = EventScene.IOC
}

