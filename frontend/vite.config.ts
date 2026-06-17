/**
 * Vite 配置。开发时将 /api 代理到后端，见 BACKEND_INTEGRATION.md
 *
 * 代理路由规则（长前缀优先匹配）：
 *   /api/agent        → agent-service :8003
 *   /api/profile      → learn-service :8005
 *   /api/learning-path → learn-service :8005
 *   /api/plan         → learn-service :8005
 *   /api/chat         → learn-service :8005
 *   /api/analytics    → learn-service :8005
 *   /api/resources    → learn-service :8005
 *   /api/exercises    → learn-service :8005
 *   /api/admin      → learn-service :8005
 *   /static          → user-service :8001
 *   /api/* (fallback) → user-service :8001
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // agent-service 对话
      "/api/agent": {
        target: "http://127.0.0.1:8003",
        changeOrigin: true,
        proxyTimeout: 180000,
        timeout: 180000,
      },
      // learn-service 学习业务（长路径优先匹配）
      "/api/profile": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/learning-path": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/plan": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/chat": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/analytics": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/resources": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/exercises": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      "/api/admin": {
        target: "http://127.0.0.1:8005",
        changeOrigin: true,
      },
      // user-service 静态头像
      "/static": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
      // user-service 认证等（兜底）
      "/api": {
        target: "http://127.0.0.1:8001",
        changeOrigin: true,
      },
      // B 站封面元数据（对话区视频卡片）
      "/bili-api": {
        target: "https://api.bilibili.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bili-api/, ""),
      },
    },
  },
});
