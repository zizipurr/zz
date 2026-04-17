import { Controller, Get, Query } from '@nestjs/common'
import { DEMO_LOCATIONS, LOCATIONS_BY_TENANT, STREETS_BY_DISTRICT } from './constants/locations'
import { TENANTS } from './constants/tenants'

@Controller('locations')
export class LocationsController {
  @Get()
  findAll() {
    return [...DEMO_LOCATIONS]
  }

  // 获取租户列表（super_admin 用）
  @Get('tenants')
  getTenants() {
    return TENANTS.map(t => ({ id: t.id, name: t.name, center: t.center }))
  }

  // 按租户获取区县列表
  @Get('districts')
  getDistricts(@Query('tenantId') tenantId?: string) {
    const tenant = TENANTS.find(t => t.id === tenantId) || TENANTS[0]
    return tenant.districts
  }

  // 按区县获取街道列表
  @Get('streets')
  getStreets(@Query('district') district?: string) {
    return STREETS_BY_DISTRICT[district ?? ''] ?? []
  }

  // 按租户获取位置列表
  @Get('by-tenant')
  getLocationsByTenant(@Query('tenantId') tenantId?: string) {
    const locations =
      (tenantId && LOCATIONS_BY_TENANT[tenantId as keyof typeof LOCATIONS_BY_TENANT]) ||
      LOCATIONS_BY_TENANT.shenzhen
    return locations
  }
}
