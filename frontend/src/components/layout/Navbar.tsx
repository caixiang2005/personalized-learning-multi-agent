/**
 * @file Navbar.tsx
 * @description 顶栏导航：4 项主架构 + 成长档案下拉（赛题能力对齐）
 */

import { NavLink, Link, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import UserMenuDropdown from "./UserMenuDropdown";
import NavGrowthMenu from "./NavGrowthMenu";
import { useLandingHeaderScrolled } from "../../hooks/useLandingHeaderScrolled";
import { PRIMARY_NAV, isHomePath } from "../../lib/navConfig";
import { resolveTutorNavTarget, isTutorNavActive, TUTOR_CHAT_PATH } from "../../lib/profileGate";
import { useAppStore } from "../../store/useAppStore";

export default function Navbar() {
  const headerScrolled = useLandingHeaderScrolled();
  const { pathname } = useLocation();
  const { profile, profileInitialized } = useAppStore();
  const tutorNav = resolveTutorNavTarget(profileInitialized, profile);

  return (
    <header
      className={`scholar-navbar app-navbar app-navbar--flush landing-header landing-glass landing-header--bar${headerScrolled ? " landing-header--scrolled" : ""}`}
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
          {PRIMARY_NAV.map((item) => {
            const isTutor = item.to === TUTOR_CHAT_PATH;
            const to = isTutor ? tutorNav.to : item.to;
            const navState = isTutor ? tutorNav.state : undefined;
            const title = isTutor && tutorNav.state?.fromTutorGate
              ? "需先完成学习画像，再使用智能辅导"
              : item.hint;

            return (
              <NavLink
                key={item.to}
                to={to}
                state={navState}
                end={item.end}
                title={title}
                className={() => {
                  const active = item.to === "/home"
                    ? isHomePath(pathname)
                    : isTutor
                      ? isTutorNavActive(pathname, profileInitialized, profile)
                      : pathname.startsWith(item.to);
                  return `nav-link ${active ? "nav-link-active" : ""}`;
                }}
              >
                {item.label}
              </NavLink>
            );
          })}
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
