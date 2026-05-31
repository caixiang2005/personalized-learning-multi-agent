import { NavLink } from "react-router-dom";
import {
  Bookmark,
  HelpCircle,
  Receipt,
  Settings,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";

const mainNav = [
  { to: "/account", label: "个人主页", icon: UserRound, end: true },
  { to: "/profile", label: "学习画像", icon: Sparkles },
  { to: "/settings", label: "偏好设置", icon: Settings },
  { to: "/reset-password", label: "账号安全", icon: Shield },
];

const soonNav = [
  { label: "错题本", icon: HelpCircle },
  { label: "我的收藏", icon: Bookmark },
  { label: "消费记录", icon: Receipt },
];

export default function AccountNavSidebar() {
  return (
    <aside className="account-nav-sidebar landing-glass-card">
      <p className="account-nav-sidebar__title">个人中心</p>
      <nav className="account-nav-sidebar__nav" aria-label="个人中心导航">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `account-nav-sidebar__link${isActive ? " account-nav-sidebar__link--active" : ""}`
            }
          >
            <item.icon size={17} strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <p className="account-nav-sidebar__title account-nav-sidebar__title--sub">即将推出</p>
      <ul className="account-nav-sidebar__soon">
        {soonNav.map((item) => (
          <li key={item.label}>
            <span className="account-nav-sidebar__soon-item" aria-disabled="true">
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
