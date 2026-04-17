# zcy-platform

智城云 Monorepo，包含后端 API、IOC 大屏、网格员移动端 H5，以及后续扩展应用。

## 项目结构

```text
zcy-platform/
├─ apps/
│  ├─ api/                  # NestJS + TypeORM + MySQL + JWT + Socket.IO
│  ├─ ioc-dashboard/        # React + Vite + Zustand + ECharts + Sass（大屏）
│  ├─ miniprogram/          # React + Vite + Sass（网格员 H5）
│  ├─ admin/                # 预留后台应用
│  └─ community-screen/     # 预留社区大屏应用
├─ packages/
│  ├─ types/                # 共享类型
│  └─ utils/                # 共享工具
├─ pnpm-workspace.yaml
└─ README.md
```

## 技术栈

| 层级 | 技术 |
|------|------|
| Monorepo | pnpm workspace |
| 后端 | NestJS、TypeORM、MySQL、JWT、Socket.IO |
| IOC 大屏 | React、Vite、Zustand、ECharts、Sass |
| 小程序和h5 | Uni-app (Vue 3 + Vite + TS 版) ,可考虑Expo, React Native, Zustand |
| 工程化 | TypeScript、ESLint、Husky、Commitlint |

## 环境要求

- Node.js `>= 20`
- pnpm `10.x`
- MySQL `8+`

## 后端环境变量（apps/api/.env）

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=你的数据库密码
DB_DATABASE=zhicheng
JWT_SECRET=zhicheng_secret_2026
JWT_EXPIRES=7d
PORT=3000
```

## 快速开始

```bash
# 1) 安装依赖（在仓库根目录）
pnpm install

# 2) 启动后端 API（localhost:3000）
pnpm --filter api start:dev

# 3) 启动 IOC 大屏（localhost:8000）
pnpm --filter ioc-dashboard dev

# 4) 启动网格员 H5（localhost:8002）
pnpm --filter miniprogram dev
```

## 常用命令

```bash
# 构建
pnpm --filter <app> build

# 安装某个子项目依赖
pnpm --filter <app> add <pkg>

# 在 workspace 根安装依赖（例如 husky）
pnpm add -D <pkg> -w

# 种子数据
pnpm --filter api seed

# 构建某个子项目
pnpm --filter <app> build
```

## 开发约定
- 全仓统一使用 `pnpm`，不混用 npm/yarn
- 新增依赖：`pnpm --filter <app> add <pkg>`
- 跨应用共享类型统一放入 `packages/types`
- 提交前执行对应子项目的 `lint` 或 `build`
- 优先使用 `@/` 别名引入，不使用跨层级 `../` 引入
- 样式统一使用 Sass（`.scss` / `.module.scss`）
- 有真实后端接口时直接调用，不写 Mock
- 新需求优先“后端接口就绪”再接前端页面

## 常见坑：后端响应被重复包装

- `apps/api` 已启用全局成功响应包装（`TransformInterceptor`），统一输出 `{ code, data, message }`
- 因此 Controller 里应直接 `return` 原始业务数据，不要手动再返回 `{ code, data, message }`
- 否则会出现“双层 data”，前端期望数组时可能拿到对象并报错，例如：`tenants.map is not a function`
- 参考场景：`/locations/tenants`、`/locations/districts`、`/locations/by-tenant` 这类接口应直接返回数组
---

私有项目，保留所有权利。