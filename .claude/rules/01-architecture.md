# 智城云 · 架构约定

> 配置体系职责边界见：`AI-CONFIG-BOUNDARIES.md`
> 本文件定位：规则库原文（架构层），不直接承担会话摘要职责

---

## 多租户隔离

### 规则
所有业务查询必须带 `tenantId` where 条件，禁止全表扫描。
`tenantId` 从 JWT payload 解析，前端不传、后端不信任前端传入的 tenantId。

```typescript
// ✅ 正确
const events = await this.repo.find({
  where: { tenantId: user.tenantId, ...filters }
})

// ❌ 错误：忘记 tenantId 过滤
const events = await this.repo.find({ where: filters })
```

### super_admin 特权
super_admin 可通过 query 参数 `?tenantId=guangzhou` 切换视角。
其他角色忽略该参数，强制使用 JWT 中的 tenantId。

---

## 场景配置化架构（sceneConfig）

四大场景（总览/社区/应急/交通/服务）共享同一套底座。
场景差异通过 `sceneConfig.ts` 配置对象驱动，不在组件内 hardcode。

```typescript
// ✅ 正确：从配置取主题色
const color = SCENE_CONFIG[activeScene].accentColor

// ❌ 错误：组件内写死颜色
const color = activeScene === 'community' ? '#00c896' : '#ff4d4f'
```

新场景接入时只扩展 `sceneConfig`，大屏框架代码零修改。

### 地图标注配色（固定，不跟随场景主题色）
```
high:   #FF1744  描边白色  尺寸：标准×1.2
mid:    #FF9100  描边白色  尺寸：标准
low:    #00B0FF  描边白色  尺寸：标准
done:   #69F0AE  描边白色  尺寸：标准×0.9
```

---

## Socket 实时通信约定

### 事件名规范
后端统一推送 `event_updated`，payload 中 `type` 字段区分子类型：

```typescript
// 后端推送
this.gateway.server.emit('event_updated', {
  type: 'new_event' | 'status_change',
  ...eventData
})

// 前端监听（唯一入口）
socket.on('event_updated', (data) => {
  if (data.type === 'new_event') { /* 插入列表 */ }
  else { /* 更新状态 */ }
})
```

**禁止**新增独立 Socket 事件名，统一走 `event_updated` 通道。

**背景**：曾因前端监听 `new_event`、后端推送 `event_updated`，
导致大屏实时通信全部失效，小程序正常（因为小程序用了正确的事件名）。

### 断线重连补偿
```typescript
socket.on('reconnect', () => {
  // 重连后主动拉一次全量数据，补偿断线期间错过的推送
  fetchEvents()
  fetchKpiSummary()
  fetchMessages()
})
```

---

## 端入口限制

```
大屏（ioc-dashboard）
  允许：super_admin / tenant_admin / grid_supervisor
  禁止：grid_staff → 返回 403 + 提示「请使用小程序登录」

小程序（miniprogram）
  允许：grid_staff 及移动端角色
  禁止：super_admin / tenant_admin
```

---

## KPI 聚合口径

`processingTotal` = `doing` + `escalated` 两种状态之和。
`escalated`（已升级）不单独出现在KPI数字里，归入处理中。
`closed`（已关闭）不计入任何有效状态统计。

**背景**：曾因 escalated 不在 processingTotal 统计内，
事件升级后从KPI数字里消失，指挥官无法感知。
