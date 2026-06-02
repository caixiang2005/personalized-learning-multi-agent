# 智慧学习中心 · 前端设计规范

> **比赛版（当前）**：`COMPETITION-DESIGN.md` + `src/styles/scholar-design-system.css`  
> **Token**：`src/lib/designTokens.ts`  
> **组件**：`src/components/scholar/*`

## 风格：Scholar AI（学术科技）

- 1px 细边框、轻阴影、12px 圆角
- 主色 `#4F46E5` · 辅色 `#0D9488`
- 字体：Plus Jakarta Sans + Noto Sans SC
- 背景：Mesh 渐变（**无书海**）

## 实现映射

| 规范 | 文件 |
|------|------|
| Scholar 覆盖 | `src/styles/scholar-design-system.css` |
| Clay 遗留兼容 | `src/styles/design-system.css` |
| 全局 | `src/index.css` |
| 页头 | `ScholarPageHeader` |
| 能力矩阵 | `CapabilityGrid` |
| 流式进度 | `StreamProgress` |
| 资源类型 | `ResourceTypeStrip` |
| 背景 | `AppMeshBackground.tsx` |

## Do / Don't

| Do | Don't |
|----|--------|
| `scholar-card` / `section-card` | 恢复 BookSeaBackground |
| `app-page-scrim` 页面根 | 3px 厚玩具边框 |
| Lucide 图标 | Emoji 图标 |
| 流式 + 骨架 + StreamProgress | 白屏等待 |
