/**
 * @file AppLayout.tsx
 * @description 登录后页面公共布局：顶栏、主内容区、移动端底栏、页面转场。
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ApiLoadingBar from "../motion/ApiLoadingBar";
import PageTransition from "../motion/PageTransition";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

const FULL_BLEED_CHAT = /^\/(chat|profile-build|path\/plan)\/?$/;

export default function AppLayout() {
  const { pathname } = useLocation();
  const chatFullBleed = FULL_BLEED_CHAT.test(pathname);

  /** 对话页由内部区域滚动，取消 html 滚动条槽位，避免右侧留白 */
  useEffect(() => {
    const root = document.documentElement;
    if (chatFullBleed) {
      root.classList.add("chat-layout");
    } else {
      root.classList.remove("chat-layout");
    }
    return () => root.classList.remove("chat-layout");
  }, [chatFullBleed]);

  return (
    <div
      className={`app-page-scrim min-h-screen flex flex-col relative overflow-x-hidden${
        chatFullBleed ? " app-page-scrim--chat" : ""
      }`}
    >
      <ApiLoadingBar />
      <Navbar />
      <main
        className={`flex-1 relative z-[1] has-mobile-nav-pad${
          chatFullBleed ? " main--chat-full" : ""
        }`}
      >
        <PageTransition />
      </main>
      <MobileNav />
    </div>
  );
}
