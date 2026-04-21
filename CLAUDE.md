---
name: CLAUDE
description: 智城云 Monorepo 项目指南
alwaysApply: true
---

> 配置体系职责边界见：`AI-CONFIG-BOUNDARIES.md`
> 本文件定位：项目背景与长期事实（结构/角色/技术栈/运行方式）

# 项目概述

智城云 Monorepo 项目，SaaS 多租户架构，包含后端 API、IOC 大屏、网格员小程序。
目标：基于 AI Native 的城市智能管理平台，支持多城市、多角色、多场景。

## 项目结构

```
zcy-platform/
├─ apps/
│  ├─ api/              # NestJS + TypeORM + MySQL + JWT + Socket.IO 后端
│  ├─ ioc-dashboard/    # React + Vite + Zustand + ECharts + Sass（IOC 大屏）
│  └─ miniprogram/      # Uni-app Vue3 + Pinia（网格员小程序）
├─ packages/            # 预留共享包
└─ pnpm-workspace.yaml
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 包管理 | pnpm workspace |
| 后端 | NestJS、TypeORM、MySQL、JWT、Socket.IO |
| 大屏 | React 19、Vite、Zustand、ECharts、Sass、Lucide React |
| 小程序 | Uni-app Vue3、Pinia |
| 类型 | TypeScript |
| 代码质量 | ESLint、Husky、Commitlint |

## 环境要求

- Node.js `>= 20`
- pnpm `10.x`
- MySQL `8+`

---

# 多租户架构

## 租户设计

当前支持两个演示租户：
- `shenzhen`：深圳市（地图中心 114.0579, 22.5431）
- `guangzhou`：广州市（地图中心 113.2644, 23.1291）

所有业务数据（User、Event 等）都携带 `tenantId` 字段，查询时自动按租户隔离。

## 角色体系

| 角色 | 说明 | 使用端 |
|------|------|--------|
| `super_admin` | 超级管理员，管所有租户 | 大屏 |
| `tenant_admin` | 城市管理员，管本城市 | 大屏 |
| `grid_supervisor` | 网格督导，管本区县 | 大屏 |
| `grid_staff` | 网格员，接单处置上报 | 小程序 |
| `community_manager` | 物业管理员（5月） | PC 后台 |
| `community_staff` | 物业员工/保安（5月） | 小程序 |
| `community_owner` | 业主（5月） | 小程序 |
| `emergency_commander` | 应急指挥官（6月） | 大屏 |
| `emergency_responder` | 应急队员（6月） | 小程序 |
| `traffic_manager` | 交通管理员（7月） | 大屏 |
| `traffic_operator` | 信号灯操作员（7月） | 小程序 |

## 角色隔离规则

```
super_admin     → 可看全部租户数据，可切换租户视角
tenant_admin    → 只看本 tenantId 的数据
grid_supervisor → 只看本 tenantId + district 的数据
grid_staff      → 只看本 tenantId + district 的数据
```

## 端入口限制

```
大屏（ioc-dashboard）
  允许：super_admin、tenant_admin、grid_supervisor
  禁止：grid_staff 及以下角色 → 提示「请使用小程序登录」

小程序（miniprogram）
  允许：grid_staff、community_owner、community_staff 等移动端角色
  禁止：super_admin、tenant_admin → 提示「请使用管理端登录」
```

---

# 开发指南

## 常用命令

```bash
# 根目录安装依赖
pnpm install

# 启动后端（端口 3000）
pnpm --filter api start:dev
# 或（带热重载）
pnpm --filter api dev

# 启动 IOC 大屏（端口 8000）
pnpm --filter ioc-dashboard dev

# 启动小程序
pnpm --filter miniprogram dev

# 构建
pnpm --filter <app> build

# 构建 dev 环境
pnpm --filter <app> build:dev
```

## 数据库迁移

```bash
# 生成迁移（改了 Entity 后必须执行）
pnpm --filter api migration:generate src/db/migrations/<名称>

# 运行迁移
pnpm --filter api migration:run

# 一步完成（生成+运行）
pnpm --filter api migration:sync

# 回滚
pnpm --filter api migration:revert

# 查看状态
pnpm --filter api migration:show
```

**命令约束：禁止使用 `npx typeorm ...`。如需直接调用 TypeORM CLI，必须用项目脚本（确保 `@/` 别名在 CLI 场景下也可解析）：**

```bash
pnpm --filter @zcy/api typeorm -- -d src/db/data-source.ts migration:run
```

**注意：禁止使用 `synchronize: true`，所有表结构变更必须通过 migration 管理。**

## 种子数据

```bash
# 手动初始化演示数据
pnpm --filter api seed:demo
```

服务启动时自动执行 seed（在 main.ts 里调用），包含：
- 必要数据：super_admin 账号（任何环境都创建）
- 演示数据：多城市账号 + 事件（每次启动重置）

### 演示账号

| 用户名 | 密码 | 角色 | 租户 | 区县 |
|--------|------|------|------|------|
| admin | admin | super_admin | shenzhen | — |
| sz_admin | admin | tenant_admin | shenzhen | — |
| grid_fukuda | 123456 | grid_staff | shenzhen | 福田区 |
| grid_nanshan | 123456 | grid_staff | shenzhen | 南山区 |
| grid_longhua | 123456 | grid_staff | shenzhen | 龙华区 |
| grid_baoan | 123456 | grid_staff | shenzhen | 宝安区 |
| gz_admin | admin | tenant_admin | guangzhou | — |
| gz_grid_yuexiu | 123456 | grid_staff | guangzhou | 越秀区 |
| gz_grid_tianhe | 123456 | grid_staff | guangzhou | 天河区 |

---

# 编码规范

## 目录结构

```
apps/api/src/
├─ modules/         # 业务模块（auth、user、event、kpi、message、mockdev）
├─ common/          # 公共模块
│  ├─ constants/    # 常量（locations.ts、tenants.ts）
│  ├─ guards/       # 守卫（jwt.guard.ts、roles.guard.ts）
│  └─ decorators/   # 装饰器（roles.decorator.ts、current-user.decorator.ts）
└─ db/
   ├─ migrations/   # 数据库迁移文件
   └─ seeds/        # 种子数据
```

## 引入方式

- 使用 `@/` 别名引入，不使用跨层级 `../` 引入
- 示例：`import { UserService } from '@/modules/user/user.service'`

## 样式规范

- 大屏统一使用 Sass（`.scss` / `.module.scss`）
- CSS 变量复用现有设计 token（`--accent-color`、`--bg-glass`、`--border-glass` 等）
- 不引入新的魔法颜色值
- 图标统一使用 Lucide React，不使用 iconfont

## 角色判断规范

```typescript
// ✅ 正确：用数组 includes
if (['super_admin', 'tenant_admin'].includes(user.role)) { }

// ❌ 错误：硬编码单个角色
if (user.role === 'admin') { }
```

## 提交规范

- 使用 Conventional Commits 格式
- 示例：`feat: 添加租户切换功能`、`fix: 修复角色隔离查询`

---

# 接口规范

## 统一响应格式

后端已启用全局 `TransformInterceptor`，统一包装响应：

```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

**Controller 层只返回业务原始数据，不要手动包装 `{ code, data, message }`，否则会被二次包装。**

## 租户隔离规范

- 所有业务查询接口自动从 JWT 取 `tenantId` 过滤数据
- `super_admin` 可通过 query 参数 `?tenantId=guangzhou` 切换视角
- 前端不需要手动传 `tenantId`，后端从 token 自动读取

## 注册接口规范

注册时以下字段由后端固定，前端不传：
- `role`：固定为 `grid_staff`
- `tenantId`：演示阶段固定为 `shenzhen`
- `status`：固定为 `active`

必填字段（后端用 class-validator 校验）：
- `username`：3-20位，字母数字下划线
- `password`：最少6位
- `realName`：2-10个字符
- `phone`：中国大陆手机号 `/^1[3-9]\d{9}$/`
- `district`：必须选择，从 `/api/locations/districts` 获取

---

# 公共接口

| 接口 | 说明 |
|------|------|
| `GET /api/locations` | 获取位置列表（默认深圳） |
| `GET /api/locations/by-tenant?tenantId=` | 按租户获取位置列表 |
| `GET /api/locations/districts?tenantId=` | 按租户获取区县列表 |
| `GET /api/locations/tenants` | 获取所有租户列表（super_admin 用） |

以上接口无需鉴权，公开访问。

---

# 执行命令限制

- **不自动执行**安装依赖类命令（`pnpm install` 等），由用户手动完成
- **不自动执行**启动服务类命令（`dev`、`start` 等长耗时任务），由用户手动完成
- **不自动执行**构建、测试等耗时命令，需要时以注释或文字说明代替
- **migration 命令**列出但不执行，由用户确认后手动运行

---

# 重要文件

| 文件 | 说明 |
|------|------|
| `apps/api/.env.local` | 本地环境变量（优先级最高） |
| `apps/api/.env.dev` | dev 环境变量 |
| `apps/api/.env` | 默认环境变量 |
| `apps/api/src/db/data-source.ts` | 数据库连接配置（migration 用） |
| `apps/api/src/app.module.ts` | 后端根模块 |
| `apps/api/src/main.ts` | 后端入口（含 seed 调用） |
| `apps/api/src/common/constants/tenants.ts` | 租户常量 |
| `apps/api/src/common/constants/locations.ts` | 位置常量 |
| `apps/api/src/db/seeds/seed-demo.ts` | 演示数据 seed |

---

# 当前开发阶段

```
4月（进行中）：IOC 大屏指挥闭环 + 多租户基础建设
5月（计划）：  智慧社区多端产品矩阵
6月（计划）：  城安应急模块
7月（计划）：  智慧交通 + 城市服务
8月（计划）：  四大场景整合 + AI 功能接入
9月（计划）：  商用冲刺 + 性能加固
```
```