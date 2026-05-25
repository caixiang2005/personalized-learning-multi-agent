/**
 * @file MobileNav.tsx
 * @description 移动端底部 Tab 导航（md 以下显示）。
 * @backend 无
 */
import { NavLink } from "react-router-dom";
import { Home, MessageSquare, Brain, Route, BarChart3 } from "lucide-react";

const items = [
  { to: "/home", label: "首页", icon: Home },
  { to: "/chat", label: "对话", icon: MessageSquare },
  { to: "/profile", label: "画像", icon: Brain },
  { to: "/path", label: "路径", icon: Route },
  { to: "/analytics", label: "评估", icon: BarChart3 },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gray-200/80 dark:border-gray-700/80 safe-area-pb">
      <div className="flex items-center justify-around h-14 px-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors ${
                isActive ? "text-primary" : "text-gray-500"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
