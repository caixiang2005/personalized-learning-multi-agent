/**
 * Vite 配置。开发时将 /api 代理到后端，见 BACKEND_INTEGRATION.md
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // agent-service 未登录 Agent（优先匹配更长前缀）
      "/api/agent": {
        target: "http://127.0.0.1:8003",
        changeOrigin: true,
      },
      // user-service 等其他接口
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
