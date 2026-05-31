/**
 * 个人中心侧栏：仅展示本系统已有功能（参考 MOOC 布局，不照搬无关入口）。
 */
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Route,
  Settings,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";

const accountNav = [
  { to: "/account", label: "个人主页", icon: UserRound, end: true },
  { to: "/account/security", label: "账号安全", icon: Shield },
];

const learnNav = [
  { to: "/profile", label: "学习画像", icon: Sparkles },
  { to: "/path", label: "学习路径", icon: Route },
  { to: "/analytics", label: "效果评估", icon: BarChart3 },
  { to: "/settings", label: "偏好设置", icon: Settings },
];

function NavItem({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string;
  label: string;
  icon: typeof UserRound;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100"
        }`
      }
    >
      <Icon size={17} strokeWidth={1.75} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AccountNavSidebar() {
  return (
    <aside className="sticky top-[4.5rem] rounded-2xl border border-gray-100 bg-white px-3 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/50">
      <p className="mb-2 px-3 text-[11px] font-semibold tracking-wide text-gray-400">个人中心</p>
      <nav className="flex flex-col gap-0.5" aria-label="个人中心">
        {accountNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <p className="mb-2 mt-5 px-3 text-[11px] font-semibold tracking-wide text-gray-400">学习中心</p>
      <nav className="flex flex-col gap-0.5" aria-label="学习中心">
        {learnNav.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
