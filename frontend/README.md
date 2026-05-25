# 智慧学习中心 · 前端

> **当前：** 未登录访客 Agent 已对接 `agent-service:8003`；其余模块仍为 Mock。登录演示密码/验证码：`123456`。

## 文档（必读）

| 文档 | 用途 |
|------|------|
| **[待与后端同步清单.md](./待与后端同步清单.md)** | 什么数据和接口以后要和 backend 对齐（推荐先看） |
| **[BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md)** | 完整 API 路径、请求体、联调步骤 |

## 代码里怎么找

- `【当前 Mock】` — 现在用的假逻辑
- `【待同步后端】` — 后端好了要改的地方
- `src/lib/api/client.ts` — 请求函数已写好，**暂未 import**，联调时再启用

## 运行

```bash
npm install
npm run dev
```

### 未登录 Agent 联调（agent-service）

1. 启动后端（端口 **8003**）：
   ```bash
   cd backend/agent-service
   # 配置 .env 中的 DEEPSEEK_API_KEY 等
   python main.py
   ```
2. 前端 `vite.config.ts` 已将 `/api/agent` 代理到 `http://127.0.0.1:8003`
3. 打开门户 `/`，点击 **AI 助手** 或 **咨询助手**，发送消息
4. 请求体：`{ user_input, session_id }`（session_id 为 UUID v4，页面刷新后重新生成）
5. 免费 **3 轮**体验，第 4 轮接口返回登录引导；后端不可用时自动降级 Mock（可设 `VITE_GUEST_CHAT_MOCK=1` 强制 Mock）

## 路由

`/`（门户，未登录）· `/login` · `/home` · `/chat` · `/profile` · `/path` · `/resource/:id` · `/exercise/:id` · `/analytics` · `/settings`

## 开源标注

- **Flowing Menu** 交互思路参考 [React Bits - Flowing Menu](https://www.reactbits.dev/components/flowing-menu)，已在 `FlowingMenu.tsx` / `FlowingDock.tsx` 中按本项目主题色与竖向 Dock 布局改造，非直接拷贝源码。
