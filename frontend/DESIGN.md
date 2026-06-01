# 智慧学习中心 · 前端设计规范 V2

> **已废弃旧版**毛玻璃 + 书海 + `#165DFF` 规范。  
> 全局 Source of Truth：`design-system/智慧学习中心/MASTER.md`（UI/UX Pro Max 生成）

## 风格：Claymorphism（高等教育适配）

- 厚边框（3px）、双阴影、圆角 16px
- 柔和 mesh 背景，无书海透视
- 字体：Plus Jakarta Sans + Noto Sans SC（**不用** Comic Neue）

## 色彩

| 角色 | 色值 |
|------|------|
| Primary | `#4F46E5` |
| Secondary | `#818CF8` |
| CTA / Accent | `#22C55E` |
| Background | `#EEF2FF` |
| Text | `#312E81` |

## 实现映射

| 规范 | 文件 |
|------|------|
| Token + Clay 覆盖 | `src/styles/design-system.css` |
| 旧组件类兼容 | `src/index.css` |
| TS Token | `src/lib/designTokens.ts` |
| 统一 UI | `src/components/ui/Ds*.tsx` |
| 全站背景 | `src/components/background/AppMeshBackground.tsx` |
| Tailwind | `tailwind.config.js` |

## Do / Don't

| Do | Don't |
|----|--------|
| 使用 `section-card` / `btn-primary` / `input-field` | 硬编码旧蓝色 `#165DFF` |
| 页面根容器 `app-page-scrim` | 恢复 BookSeaBackground |
| Lucide 图标 | Emoji 当图标 |
| `cursor-pointer` + 200ms 过渡 | 无 hover 的可点击元素 |
