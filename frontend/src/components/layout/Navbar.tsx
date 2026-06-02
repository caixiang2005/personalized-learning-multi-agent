/**
 * @file Navbar.tsx
 * @description 顶部导航：品牌、页面链接、用户悬停下拉菜单。
 */

import { NavLink, Link } from "react-router-dom";
import { BookOpen, GraduationCap } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import UserMenuDropdown from "./UserMenuDropdown";
import { useLandingHeaderScrolled } from "../../hooks/useLandingHeaderScrolled";

const navItems = [
  { to: "/home", label: "首页" },
  { to: "/chat", label: "学习对话" },
  { to: "/scan", label: "拍照搜题" },
  { to: "/plan", label: "日计划" },
  { to: "/profile", label: "学习画像" },
  { to: "/path", label: "学习路径" },
  { to: "/analytics", label: "效果评估" },
];

export default function Navbar() {
  const headerScrolled = useLandingHeaderScrolled();

  return (
    <header
      className={`scholar-navbar app-navbar landing-header landing-glass landing-header--bar${headerScrolled ? " landing-header--scrolled" : ""}`}
    >
      <div className="landing-header__inner app-navbar__inner">
        <Link to="/home" className="landing-brand">
          <span className="landing-brand__icon">
            <GraduationCap size={18} strokeWidth={2} />
          </span>
          <span>
            <span className="landing-brand__title">智慧学习中心</span>
            <span className="landing-brand__sub hidden lg:block">个性化学习多智能体系统</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="landing-header__actions app-navbar__actions">
          <Link to="/path" className="app-navbar__path-link hidden sm:inline-flex">
            <BookOpen size={17} strokeWidth={1.75} />
            学习中心
          </Link>
          <ThemeToggle />
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}
