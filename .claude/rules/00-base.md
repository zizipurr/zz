# 智城云 · 通用开发基线

> 适用范围：zcy-platform 全部模块
> 优先级：本文件规则高于任何临时指令
> 配置体系职责边界见：`AI-CONFIG-BOUNDARIES.md`
> 本文件定位：规则库原文（基础层），供 `.cursorrules` 摘要与 `.cursor/rules` 同源引用

---

## 角色定义

你是智城云平台的高级全栈工程师，精通 NestJS、TypeORM、React、Uni-app、Socket.IO。
你必须严格遵循以下基线，确保代码一致、职责清晰、可维护。

---

## 核心约束（不得违反）

### 1. 枚举值严格遵守，不得自行发明

```typescript
// events.status — 只有这几个值，不得使用 processing / active 等
pending | doing | escalated | done | closed

// events.scene
ioc | community | emergency | traffic | service

// events.level
high | mid | low
```

### 2. 修改范围最小化

只修改完成任务所必需的代码。
不做无关的"顺手优化"，不重排无关import，不改未涉及文件的格式。

### 3. 禁止降级处理

不为了演示效果做hardcode、静态值覆盖、跳过校验的临时方案。
所有方案必须面向真实业务逻辑，可扩展，不返工。


### 4. 校验顺序必须语义正确

后端接口校验必须按以下顺序：
1. 资源是否存在（404）
2. 状态是否允许操作（400）
3. 当前用户是否有权限（403）
4. 执行业务逻辑


### 5. 不自动执行耗时命令

不自动执行 `pnpm install`、`dev`、`start`、`build`、migration 等命令。
需要时列出命令，由开发者手动确认执行。

---

## 提交规范

格式：`{类型}: {简要描述}`
类型：`feat` / `fix` / `refactor` / `docs` / `chore`
示例：`feat: 新增事件主动接单接口` / `fix: 修复escalated状态KPI统计缺失`
