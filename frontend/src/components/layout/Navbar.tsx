/**
 * @file Navbar.tsx
 * @description 顶部导航：品牌、页面链接、学习中心、主题、设置、退出。
 */

import { NavLink, Link, useNavigate } from "react-router-dom";
import { BookOpen, GraduationCap, LogOut, User } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { logoutLocal } from "../../lib/api/user";
import { useAppStore } from "../../store/useAppStore";
import { useLandingHeaderScrolled } from "../../hooks/useLandingHeaderScrolled";

const navItems = [
  { to: "/home", label: "首页" },
  { to: "/chat", label: "学习对话" },
  { to: "/profile", label: "学习画像" },
  { to: "/path", label: "学习路径" },
  { to: "/analytics", label: "效果评估" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { setLoggedIn, setUser } = useAppStore();
  const headerScrolled = useLandingHeaderScrolled();

  const logout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    <header
      className={`app-navbar landing-header landing-glass landing-header--bar${headerScrolled ? " landing-header--scrolled" : ""}`}
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
          <Link to="/account" className="app-navbar__icon-btn" aria-label="个人信息">
            <User size={18} strokeWidth={1.75} />
          </Link>
          <button type="button" onClick={logout} className="app-navbar__icon-btn app-navbar__icon-btn--danger" aria-label="退出">
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
}
