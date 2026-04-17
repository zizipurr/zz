# Design System: Digital Twin Command Center (数字孪生指挥舱 SCSS 规范)

> 本文件为项目 AI Agent 的核心设计规范。所有 UI 开发必须严格遵守以下约定。

---

## 1. 核心布局哲学

- **固定视口全屏（当前 IOC 驾驶舱采用）**：`html, body, #root` 使用 `height: 100%` / `max-height: 100dvh` 且 `overflow: hidden`，**不出现页面滚动条、不滚动**。内容必须在视口内排布；列表与长文案使用 `overflow: hidden`、省略或多行截断（如 `-webkit-line-clamp`），超出部分裁剪而非滚动。
- **Flex 高度链**：从 `#root` → `.app-shell` → `MainLayout` → `Dashboard.dashboardPage` → `.dashboardContainer` 逐级 `flex: 1; min-height: 0; overflow: hidden`，否则 Grid 子项无法正确收缩。
- **视觉中心化 (Center-Focused)**：主内容区使用三列 CSS Grid（`minmax(0, 320px) minmax(0, 1fr) minmax(0, 320px)`），中央列为 3D / 地图画布占位，行高为 `minmax(0, 1fr)` 占满剩余高度。
- **悬浮 HUD 质感**：左右两侧为毛玻璃卡片（`.glassPanel`），左栏可用 `grid-template-rows: 1fr 1fr` 均分两块面板；右栏为纵向 `flex`，固定高度块用 `.glassPanelShrink`，剩余空间用 `.glassPanelGrow` + 内部 `overflow: hidden`。
- **登录页例外**：`/login` 的 `.page` 使用 `position: fixed; inset: 0; overflow-y: auto`，避免全局锁死后小屏无法完成登录。

---

## 2. 主题系统规范（必须遵守）

### 主题切换机制
- 通过 `html.dark` class 控制暗色模式，`useTheme` hook 负责切换逻辑。
- 在 `index.html` 的 `<head>` 中必须有**主题初始化内联 script**，防止页面加载时的 FOUC（闪烁）。
- 使用 `localStorage.getItem('theme')` 持久化用户偏好。

### 双主题变量定义（在 `global.scss` 中）
```scss
:root {
  /* 亮色模式 (Light Mode - Nexora 实体沙盘风) */
  --bg-canvas: #f0f4f8;         /* 底层背景 */
  --bg-glass: rgba(255,255,255,0.75); /* 毛玻璃面板底色 */
  --border-glass: rgba(0,0,0,0.08);  /* 边框 */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --accent-color: #f97316;      /* 活力橙 */
  --accent-hover: #ea580c;
  --accent-glow: drop-shadow(0 0 8px rgba(249,115,22,0.35));
  --shadow-panel: 0 4px 24px rgba(0,0,0,0.08);
}

html.dark {
  /* 暗色模式 (Dark Mode - Elementum 深空指挥风) */
  --bg-canvas: #050810;
  --bg-glass: rgba(15,25,60,0.5);
  --border-glass: rgba(255,255,255,0.08);
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --accent-color: #22d3ee;      /* 赛博青 */
  --accent-hover: #06b6d4;
  --accent-glow: drop-shadow(0 0 10px rgba(34,211,238,0.6));
  --shadow-panel: 0 8px 32px rgba(8,145,178,0.12);
}
```

---

## 3. 样式开发规范（严格遵守）

- **禁止使用 Tailwind**：本项目使用纯 SCSS + CSS Modules。
- **禁止写死颜色值**：严禁在 SCSS 中直接使用 `#fff`, `#000`, `rgba(23, 37, 84, 0.4)` 等硬编码颜色。所有颜色、背景、边框必须使用 `var(--xxx)` 引用全局主题变量。
- **使用 SCSS 嵌套**：充分利用 SCSS 的嵌套语法（`&:hover`, `&::before`），保持代码整洁。
- **禁止内联 style**：不能在 JSX 中使用 `style={{ color: 'xxx' }}`，所有样式必须在 `.module.scss` 中声明。

---

## 4. 核心组件 SCSS 实现指南

### A. 悬浮毛玻璃面板 (.glassPanel)
```scss
.glassPanel {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-glass);
  border-radius: 16px;
  box-shadow: var(--shadow-panel);
  color: var(--text-primary);
  padding: 20px;
  transition: background 0.3s ease, border-color 0.3s ease;

  /* 科技感边角装饰（可选） */
  &::before {
    content: '';
    position: absolute; top: -1px; left: -1px;
    width: 16px; height: 16px;
    border-top: 2px solid var(--accent-color);
    border-left: 2px solid var(--accent-color);
    border-top-left-radius: 16px;
  }
}
```

### B. 核心大数字 (.heroNumber)
```scss
.heroNumber {
  font-family: var(--font-mono);
  font-size: 2rem;
  font-weight: bold;
  color: var(--accent-color);
  filter: var(--accent-glow); /* 发光特效 */
}
```

### C. 辅助文字 (.secondaryText)
```scss
.secondaryText {
  color: var(--text-secondary);
  font-size: 12px;
}
```

### D. 操作按钮 (.commandBtn / .commandBtnOutline)
```scss
.commandBtn {
  background-color: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: var(--accent-hover);
    filter: var(--accent-glow);
  }
}

.commandBtnOutline {
  background: transparent;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
  /* ...同上 hover 发光 */
}
```

### E. TopBar / TabNav 顶部组件
顶部栏和导航栏同样必须使用变量，以支持主题切换：
```scss
.topbar, .nav {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-glass);
  box-shadow: var(--shadow-panel);
  transition: background 0.3s ease;
}
```

---

## 5. 亮/暗切换 Hook（useTheme）

```ts
// src/hooks/useTheme.ts
import { useEffect, useState } from 'react'

export function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return { isDark, toggle: () => setIsDark(v => !v) }
}
```

在 `TopBar` 中引入并在右侧渲染一个 `themeBtn` 切换按钮（🌙 / ☀️）。

---

## 6. 全屏滚动 vs. 固定视口

| 方案 | body overflow | #root | 列表区域 |
|------|--------------|-------|----------|
| **固定视口（IOC 当前采用）** | `overflow: hidden` | `height: 100%; max-height: 100dvh; overflow: hidden` | `overflow: hidden` 裁剪，不滚动 |
| 整页滚动（可选） | `overflow-y: auto` | `min-height: 100vh` | 可随页面滚动或内部滚动 |

当前 IOC 架构：**零滚动**大屏；`TabNav` 使用 `flex-wrap: wrap` + `overflow: hidden`，避免横向滚动条。
