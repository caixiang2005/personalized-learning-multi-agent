# AGENTS.md — 前端

## 设计规范（必读）

**V2 设计系统**：`design-system/智慧学习中心/MASTER.md` + `DESIGN.md` + `src/styles/design-system.css`

旧版毛玻璃/书海/`#165DFF` 规范已废弃，勿再引用。

## 技术栈

- React 19、TypeScript、Vite、Tailwind CSS v4
- 全局样式：`src/index.css` + `src/styles/design-system.css`
- 统一组件：`src/components/ui/DsCard.tsx`、`DsButton.tsx`、`DsField.tsx`
- 状态：`src/store/useAppStore.ts`
- API：`src/lib/api/`

## 常用命令

```bash
npm install
npm run dev
npm run build
```

## 约定

- 门户 `/` → `Landing.tsx`；登录后首页 `/home`
- 全站背景：`AppMeshBackground`（`App.tsx`）
- 页面根：`app-page-scrim`
- 未要求时不提交 `.env`、不擅自 `git commit`
