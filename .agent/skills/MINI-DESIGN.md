# Universal Design Language: Aura System
**适用于网格员、政务 H5 及全系列小程序通用 UI 设计规范**

---

## 1. 设计哲学：通用与灵活
*Aura System* 旨在平衡移动端的**亲和力**与政务端的**专业性**。其核心特征是：
- **悬浮感 (Floating)**：内容承载于独立卡片，通过投影区分层级。
- **色彩情绪 (Mood)**：通过背景渐变（Aura Gradient）定义页面的情绪基调。
- **原子化 (Atomic)**：所有样式组件化、变量化，实现“一处修改，全线生效”。

---

## 2. 主题引擎：快速切换机制 (Theming Engine)

为了实现快速切换，我们采用 **CSS 变量分层架构**。您只需要修改根节点的 `data-theme` 属性或切换父级 Class。

### 2.1 基础变量 (Tokens)
所有组件样式必须引用变量名，禁止裸写色值。

**智城云小程序（`apps/miniprogram`）**：`src/uni.scss` 已在全局 `page` 上挂载 **Aura Bright** 变量（`--primary: #3482ff`、`--primary-gradient` 等）。自定义 Tab、个人中心区、统计主色等**必须与 `--primary` 一致**；需要激活态时可使用 `--tab-active`（与 `--primary` 同源）。

```scss
/* themes.scss */

/* 1. 默认主题：Aura Bright (极光蓝) */
[data-theme='aura-bright'] {
  --primary: #3482ff;
  --primary-gradient: linear-gradient(135deg, #4d8aff, #3482ff);
  --primary-sub: #9dd3ff;
  --aura-bg: linear-gradient(135deg, #e1f3ff 0%, #ece9ff 45%, #e1fbf0 100%);
  --card-bg: rgba(255, 255, 255, 0.95);
  --text-main: #1e293b;
  --shadow: 0 30rpx 80rpx rgba(52, 130, 255, 0.08);
}

/* 2. 警务/应急主题：Emergency Red (警务红) */
[data-theme='emergency'] {
  --primary: #e11d48;
  --primary-gradient: linear-gradient(135deg, #f43f5e, #e11d48);
  --primary-sub: #fecdd3;
  --aura-bg: linear-gradient(135deg, #fff1f2 0%, #fae8ff 100%);
  --card-bg: rgba(255, 255, 255, 0.98);
  --text-main: #450a0a;
  --shadow: 0 30rpx 80rpx rgba(225, 29, 72, 0.1);
}

/* 3. 深夜模式：Midnight Dark (深夜) */
[data-theme='dark'] {
  --primary: #3b82f6;
  --aura-bg: #0f172a;
  --card-bg: #1e293b;
  --text-main: #f8fafc;
  --text-sub: #94a3b8;
  --input-bg: #334155;
  --shadow: 0 20rpx 50rpx rgba(0, 0, 0, 0.3);
}
```

---

## 3. 全局布局规范 (Universal Layout)

- **容器约束**：
  - 页面背景：`background: var(--aura-bg);`
  - 移动端最大显示宽度：`max-width: 600rpx`（针对卡片）。
- **栅格系统**：使用 **8px (16rpx)** 为最小单位。间距建议：`16 / 24 / 32 / 48 rpx`。
- **悬浮卡片 (`.card`)**：
  - 宽度比例：页面宽度的 `82% ~ 90%`。
  - 视觉层级：`box-shadow: var(--shadow);`。
  - 边框：`border: 1px solid rgba(255,255,255,0.6);`。

---

## 4. 组件开发规范 (Components)

### 4.1 输入组件 (Inputs)
- **块状设计**：抛弃线框，使用色块背景。
- **背景色**：`background: var(--input-bg, #f1f4f8);`
- **高度**：统一为 `104rpx`，圆角 `16rpx`。

### 4.2 按钮组件 (Buttons)
- **主按钮**：使用 `var(--primary-gradient)` 或 `var(--primary-sub)`。
- **反馈**：点击时 `transform: scale(0.97); transition: 0.2s;`。
- **文字**：字间距 `4rpx`，加粗 `600`。

### 4.3 标签与状态 (Status Tags)
遵循“浅底深字”原则，增强可读性：
- **High/紧急**：`color: #e11d48; background: #fff1f2;`
- **Doing/处理**：`color: #3482ff; background: #eff6ff;`
- **Done/完成**：`color: #10b981; background: #f0fdf4;`

### 4.4 必填项标记 (Required Marker)
- **统一形式**：所有必填字段标题前使用红色 `*`，禁止每页单独硬编码。
- **全局类名**：在全局样式中定义并复用 `.required-label`。
- **推荐实现**：
  ```scss
  .required-label {
    display: inline-flex;
    align-items: center;
  }

  .required-label::before {
    content: '*';
    color: #e11d48;
    font-weight: 700;
    margin-right: 8rpx;
  }
  ```
- **行为一致性**：出现必填 `*` 的字段，提交时必须有对应校验提示（toast 或行内错误信息）。

---

## 5. 交互与动效 (Motion)

- **进入动画 (Entry)**：
  ```scss
  @keyframes auraFadeUp {
    from { opacity: 0; transform: translateY(40rpx); }
    to { opacity: 1; transform: translateY(0); }
  }
  ```
- **微交互**：所有可点击元素必须有 `active` 态（透明度下降或轻微缩放）。
- **玻璃化**：针对顶部 Tab 或弹出层，启用 `backdrop-filter: blur(10px);`。

---

## 6. H5 与小程序适配 (Adaptation)

1. **单位使用**：统一使用 `rpx` 以适配各种屏幕。在纯 H5 端，构建工具会自动转换为 `px/rem`。
2. **安全区**：
   - 底部操作栏：`padding-bottom: env(safe-area-inset-bottom);`
   - 顶部状态栏：考虑小程序胶囊按钮高度，卡片顶部留白建议 `> 140rpx`。
3. **居中策略**：在 H5 端（Pad/PC 预览）设置容器 `max-width: 480px; margin: 0 auto;` 确保视觉不散架。

---

## 7. AI Agent 协作清单 (AI Implementation)

如果您需要 AI 为您生成新页面，请直接发送以下指令：

> **指令模板**：
> “按照 **Aura System 2.0 规范** 生成一个 [页面名称]：
> 1. 严格使用 `var(--xxx)` 变量，支持 `data-theme` 切换。
> 2. 页面背景使用 `var(--aura-bg)`，主体内容承载于悬浮卡片内。
> 3. 输入框采用块状设计，按钮使用 `var(--primary-sub)` 风格。
> 4. 保持移动端优先布局，卡片宽度 `width: 85%`。
> 5. 保留所有功能逻辑注释，禁止删除旧代码注释。”

---

## 8. 快速主题切换示例代码 (Logic)

在 `App.vue` 或全局状态管理中：

```typescript
// 切换主题逻辑
const toggleTheme = (themeName: 'aura-bright' | 'emergency' | 'dark') => {
  // 1. 设置到根节点 (H5 适用)
  document.documentElement.setAttribute('data-theme', themeName);
  
  // 2. 小程序环境建议使用 class 绑定在最外层 view
  currentThemeClass.value = themeName;
}
```