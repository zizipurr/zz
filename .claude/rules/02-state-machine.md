# 智城云 · 事件状态机规范

> 配置体系职责边界见：`AI-CONFIG-BOUNDARIES.md`
> 本文件定位：状态机规则源文件（`.cursor/rules/state-machine.mdc` 应与此同源）

---

## 状态定义

```
pending     待处理  事件上报后的初始状态
doing       处理中  已派单或已接单，处置进行中
escalated   已升级  网格员上报无法处理，等待指挥官重新研判
done        已完结  处置完成，结果已回传
closed      已关闭  误报或其他原因关闭，指挥官操作
```

## 合法流转路径

```
pending → doing      （指挥官派单 / 网格员主动接单）
doing   → escalated  （网格员上报无法处理）
doing   → done       （网格员完结）
doing   → closed     （指挥官关闭）
escalated → doing    （指挥官改派）
escalated → closed   （指挥官关闭）
pending → closed     （指挥官关闭误报）

❌ 禁止：done → 任何状态
❌ 禁止：closed → 任何状态
❌ 禁止：跨状态跳转（pending → done）
```

## 时间戳语义

| 字段 | 写入时机 | 为 null 时含义 |
|---|---|---|
| createdAt | 事件创建时 | 不应为 null |
| dispatchedAt | 指挥官派单 / 网格员主动接单 | 尚未派单 |
| startedAt | 网格员点「接单处理」确认到场 / 主动接单时同时写入 | 尚未到场确认 |
| escalatedAt | 网格员上报升级 | 未升级 |
| completedAt | 网格员完结 | 尚未完结 |
| closedAt | 指挥官关闭 | 未关闭 |

## 主动接单 vs 指挥官派单的差异

| | 指挥官派单 | 网格员主动接单（claim） |
|---|---|---|
| dispatchedAt | 派单时写入 | claim时写入 |
| startedAt | null（需网格员再次确认） | claim时同时写入 |
| 小程序下一步 | 显示「接单处理」按钮 | 直接显示「完成处置」 |

**逻辑**：主动接单代表"我看到了+我来处理+我已在路上"，
不需要再走一遍接单确认。

## 接口校验规范（每个接口的前置检查）

### dispatch（派单）
```
1. status === 'pending' → 否则 400「只有待处理事件可派单」
2. 当前用户有派单权限 → 否则 403
```

### claim（主动接单）
```
1. status === 'pending' → 否则 400
2. assigneeId === null → 否则 409「该事件已被接单或派单」
3. 乐观锁：UPDATE WHERE status='pending' AND assigneeId IS NULL
   affected=0 → 409（并发保护）
```

### start（接单确认）
```
1. status === 'doing' → 否则 400
2. assigneeId === currentUser.id → 否则 403
```

### escalate（上报升级）
```
1. status === 'doing' → 否则 400
2. startedAt IS NOT NULL → 否则 400「需先确认接单」
3. assigneeId === currentUser.id → 否则 403
```

### reassign（改派）
```
1. status IN ('doing', 'escalated') → 否则 400
2. 当前用户有派单权限 → 否则 403
3. 改派后：startedAt = null，escalateReason = null
```

### complete（完结）
```
1. status NOT IN ('closed', 'done', 'pending') → 否则 400
   注：pending状态的400优先于assigneeId的403
2. assigneeId === currentUser.id → 否则 403
```

### close（关闭）
```
1. status NOT IN ('done', 'closed') → 否则 400
2. 当前用户有关闭权限 → 否则 403
```

## 小程序按钮逻辑（完整版）

```
pending + assigneeId=null + 本区县事件：「主动接单」
pending + assigneeId有值：无按钮（别人的单）
doing + startedAt=null + 我的工单：「接单处理」
doing + startedAt有值 + 我的工单：「完成处置」+「无法处理，上报升级」
escalated + 我的工单：只读提示「已上报升级，等待重新安排」
done：「已完结」标签
closed：关闭原因卡片，无操作按钮
```
