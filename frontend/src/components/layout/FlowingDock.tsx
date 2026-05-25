/**
 * @file FlowingDock.tsx
 * @description 右侧竖向快捷 Dock，基于 React Bits Flowing Menu 改造（垂直布局 + 项目主题色）。
 * @see https://www.reactbits.dev/components/flowing-menu （MIT，已适配）
 */

import FlowingMenu, { type FlowingMenuItem } from "./FlowingMenu";

const dockItems: FlowingMenuItem[] = [
  { link: "/login", text: "登录", image: "linear-gradient(135deg, #165dff, #4f8cff)" },
  { link: "/login", text: "画像", image: "linear-gradient(135deg, #36d399, #6ee7b7)" },
  { link: "/login", text: "路径", image: "linear-gradient(135deg, #6366f1, #a78bfa)" },
  { link: "/login", text: "资源", image: "linear-gradient(135deg, #f59e0b, #fbbf24)" },
  { link: "/login", text: "评估", image: "linear-gradient(135deg, #ec4899, #f472b6)" },
];

export default function FlowingDock() {
  return (
    <div className="flowing-dock hidden lg:block">
      <p className="flowing-dock__title">快捷入口</p>
      <FlowingMenu
        variant="dock"
        items={dockItems}
        textColor="#fff"
        bgColor="transparent"
        marqueeBgColor="#165dff"
        marqueeTextColor="#ffffff"
        borderColor="rgba(255,255,255,0.12)"
      />
    </div>
  );
}
