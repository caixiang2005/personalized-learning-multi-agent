/**
 * @file AppLayout.tsx
 * @description 登录后页面公共布局：顶栏、主内容区、移动端底栏、页面转场。
 */
import ApiLoadingBar from "../motion/ApiLoadingBar";
import PageTransition from "../motion/PageTransition";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

export default function AppLayout() {
  return (
    <div className="app-page-scrim min-h-screen flex flex-col relative overflow-x-hidden">
      <ApiLoadingBar />
      <Navbar />
      <main className="flex-1 relative z-[1]">
        <PageTransition />
      </main>
      <MobileNav />
    </div>
  );
}
