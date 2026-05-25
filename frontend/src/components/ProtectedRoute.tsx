/**
 * @file ProtectedRoute.tsx
 * @description 路由守卫：未登录重定向到 /login。
 * @backend 可扩展为校验 token 有效性（GET /api/auth/verify）
 */
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
