# AGENTS.md — 前端

本文件告诉 **编码 Agent 如何构建前端**；视觉样式以 **[DESIGN.md](./DESIGN.md)** 为准。

## 干活前必读（约束顺序）

1. **[DESIGN.md](./DESIGN.md)** — 颜色、字体、毛玻璃、圆角、门户背景、Do/Don't  
2. **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** — API 路径、请求体、联调步骤  
3. **[待与后端同步清单.md](./待与后端同步清单.md)** — Mock 与待联调项  

仓库根目录 `.cursor/rules/design-system.mdc` 会指向本目录的 `DESIGN.md`。

## 技术栈

- React 19、TypeScript、Vite、Tailwind CSS v4
- 全局样式与组件类：`src/index.css`
- 状态：`src/store/useAppStore.ts`
- API：`src/lib/api/`

## 常用命令

```bash
npm install
npm run dev
npm run build
```

联调访客 Agent 时需同时启动 `backend/agent-service`（:8003），见 [README.md](./README.md)。

## 约定

- 未登录门户：`/` → `Landing.tsx`；登录后首页：`/home`
- 全站书海背景：`App.tsx` → `BookSeaBackground`；页面根用 `app-page-scrim`（见 DESIGN.md §6）
- **不要**在未要求时提交 `.env` 或擅自 `git commit`

## 设计参考

[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) — 本项目已提炼为 **DESIGN.md**，勿照搬其它品牌覆盖赛题蓝绿配色。

更多说明见 [docs/design/README.md](./docs/design/README.md)。
