# 智城云 · 测试规范

> 配置体系职责边界见：`AI-CONFIG-BOUNDARIES.md`
> 本文件定位：测试规则库原文（全量细节），`.cursorrules` 仅保留 checklist 摘要

---

## 增量自测工作流

每次完成功能开发后，只跑改动涉及的模块，不跑全量：

```bash
# 只测事件状态机（改了派单/完结/升级接口时）
node test/run-delta.mjs state-machine

# 只测消息中心
node test/run-delta.mjs messages

# 只测KPI聚合
node test/run-delta.mjs kpi

# 全量（提交前跑一次）
node test/run-delta.mjs

# 指定测试环境
BASE_URL=https://staging.example.com node test/run-delta.mjs
```

## 文件 → 测试模块映射

| 改动文件 | 需要跑的模块 |
|---|---|
| event.service.ts / event.controller.ts | state-machine |
| message.service.ts | messages |
| kpi.service.ts | kpi |
| auth / user 相关 | auth |
| 多租户隔离逻辑 | tenant |

## 提交前 Checklist

- [ ] 对应模块测试全部通过（0 失败）
- [ ] 多租户隔离未被破坏（tenant 模块通过）
- [ ] 无 hardcode tenantId 或跳过权限的临时代码
- [ ] 无 console.log 调试语句（允许 console.error）

## 测试用例编写原则

### 每个接口必须覆盖的边界

```
1. 正常路径（happy path）
2. 状态不允许（400）
3. 权限不够（403）
4. 资源不存在（404）
5. 重复操作/并发冲突（400/409）
```

### 状态机测试必须覆盖

```
1. 合法流转（每条路径至少一个用例）
2. 非法流转（done/closed 状态不可再操作）
3. 跨用户操作（非 assignee 不能完结/升级）
4. 并发保护（claim 接口乐观锁验证）
```

### 数据自洽验证

KPI数字必须和事件列表数量对得上：
- emergencies = scene=emergency AND status=pending AND level=high 的事件数
- processingTotal = doing + escalated 的事件数
- trafficOnline + trafficAnomaly = trafficTotal

## 演示数据规范

seed 数据是真实业务数据，不是假数据。规则：

```typescript
// ✅ 用相对时间，每次 seed 后数据都是"刚发生的"
createdAt: minsAgo(480)    // 8小时前

// ❌ 写死时间戳，时间戳不会随时间推移
createdAt: new Date('2026-04-01')
```

状态和时间戳强绑定：
- status=pending：只有 createdAt，其余为 null
- status=doing：有 createdAt + dispatchedAt，completedAt 为 null
- status=done：四个时间戳全部有值，且时间递增

## 自测文档位置

```
docs/qa/
├── 0421test.md          AI自测结果记录
├── test-guide.md        AI自测执行指南
├── manual-test-cases.md 人工自测用例（V1，55项）
└── manual-test-v2.md    人工自测用例（V2，34项，新增功能）
```
