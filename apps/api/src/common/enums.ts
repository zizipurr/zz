export enum EventLevel {
  HIGH = 'high',
  MID = 'mid',
  LOW = 'low',
}

export enum EventStatus {
  PENDING = 'pending',
  DOING = 'doing',
  DONE = 'done',
}

export enum MessageType {
  ALERT = 'alert',
  DISPATCH = 'dispatch',
  COMPLETE = 'complete',
  SYSTEM = 'system',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',           // 超级管理员（平台层，管所有租户）
  TENANT_ADMIN = 'tenant_admin',         // 城市管理员（管本城市所有数据）
  GRID_CITY_ADMIN = 'grid_city_admin',   // 市级网格管理员（看全市所有区域）
  GRID_SUPERVISOR = 'grid_supervisor',   // 网格督导（区县负责人）
  GRID_STAFF = 'grid_staff',             // 网格员（接单处置上报）
  COMMUNITY_MANAGER = 'community_manager',  // 物业管理员（5月用）
  COMMUNITY_STAFF = 'community_staff',      // 物业员工/保安（5月用）
  COMMUNITY_OWNER = 'community_owner',      // 业主（5月用）
  EMERGENCY_COMMANDER = 'emergency_commander', // 应急指挥官（6月用）
  EMERGENCY_RESPONDER = 'emergency_responder', // 应急队员（6月用）
  TRAFFIC_MANAGER = 'traffic_manager',      // 交通管理员（7月用）
  TRAFFIC_OPERATOR = 'traffic_operator',    // 信号灯操作员（7月用）
}