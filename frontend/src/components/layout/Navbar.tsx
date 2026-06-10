/**
 * @file Navbar.tsx
 * @description 顶栏导航：4 项主架构 + 成长档案下拉（赛题能力对齐）
 */

import { NavLink, Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import UserMenuDropdown from "./UserMenuDropdown";
import NavGrowthMenu from "./NavGrowthMenu";
import { useLandingHeaderScrolled } from "../../hooks/useLandingHeaderScrolled";
import { PRIMARY_NAV } from "../../lib/navConfig";

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

        <nav className="app-navbar__nav hidden md:flex items-center gap-1 flex-1 justify-center">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.hint}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
          <NavGrowthMenu />
        </nav>

        <div className="landing-header__actions app-navbar__actions">
          <ThemeToggle />
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}
