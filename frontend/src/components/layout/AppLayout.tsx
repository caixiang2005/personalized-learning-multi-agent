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
    <div className="app-page-scrim min-h-screen flex flex-col relative overflow-x-hidden">
      <Navbar />
      <main className="flex-1 relative z-[1]">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
