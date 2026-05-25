/**
 * @file AppLayout.tsx
 * @description 登录后页面公共布局：顶栏、主内容区、移动端底栏、背景装饰。
 * @backend 无
 */
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-surface-dark relative overflow-x-hidden">
      <div className="blob-decoration w-[420px] h-[420px] bg-primary/30 -top-32 -right-32" />
      <div className="blob-decoration w-[320px] h-[320px] bg-accent/25 -bottom-20 -left-20" />

      <Navbar />
      <main className="flex-1 relative z-[1]">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
