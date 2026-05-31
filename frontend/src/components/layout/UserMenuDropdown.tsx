/**
 * 顶栏用户头像悬停下拉（参考：简洁列表 + 分区快捷入口）
 */
import { useCallback, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookMarked,
  ChevronRight,
  MessageSquare,
  Route,
  Settings,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";
import UserAvatar from "../account/UserAvatar";
import { logoutLocal } from "../../lib/api/user";
import { useAppStore } from "../../store/useAppStore";

const learnShortcuts = [
  { to: "/chat", label: "学习对话", icon: MessageSquare, tone: "blue" },
  { to: "/path", label: "学习路径", icon: Route, tone: "green" },
  { to: "/analytics", label: "效果评估", icon: BarChart3, tone: "purple" },
];

const menuItems = [
  { to: "/account", label: "个人主页", icon: UserRound, badge: "主页" },
  { to: "/profile", label: "学习画像", icon: Sparkles },
  { to: "/settings", label: "偏好设置", icon: Settings },
  { to: "/reset-password", label: "修改密码", icon: Shield },
];

export default function UserMenuDropdown() {
  const navigate = useNavigate();
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);

  const user = useAppStore((s) => s.user);
  const profile = useAppStore((s) => s.profile);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const setUser = useAppStore((s) => s.setUser);

  const userId = user?.userId ?? 1;
  const username = user?.username ?? "用户";
  const displayName = profile.name || username;

  const openMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }, []);

  const logout = () => {
    logoutLocal();
    setUser(null);
    setLoggedIn(false);
    setOpen(false);
    navigate("/login");
  };

  return (
    <div
      className="user-menu"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocus={openMenu}
      onBlur={scheduleClose}
    >
      <button
        type="button"
        className={`user-menu__trigger app-navbar__icon-btn${open ? " user-menu__trigger--open" : ""}`}
        aria-label="个人菜单"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <UserAvatar
          userId={userId}
          displayName={displayName}
          username={username}
          size="md"
          className="user-menu__trigger-avatar"
        />
      </button>

      {open && (
        <div className="user-menu__panel landing-glass-card" role="menu">
          <Link to="/account" className="user-menu__head" onClick={() => setOpen(false)}>
            <UserAvatar userId={userId} displayName={displayName} username={username} size="md" />
            <div className="user-menu__head-text">
              <p className="user-menu__name">{displayName}</p>
              <p className="user-menu__sub">@{username}</p>
            </div>
            <ChevronRight size={16} className="user-menu__head-arrow" />
          </Link>

          <div className="user-menu__section">
            <p className="user-menu__section-title">
              <BookMarked size={14} strokeWidth={1.75} />
              我的学习
            </p>
            <div className="user-menu__grid">
              {learnShortcuts.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="user-menu__grid-item"
                  onClick={() => setOpen(false)}
                >
                  <span className={`landing-icon-tone landing-icon-tone--${item.tone} landing-icon-tone--sm`}>
                    <item.icon size={15} strokeWidth={1.75} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <ul className="user-menu__list">
            {menuItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="user-menu__link" onClick={() => setOpen(false)} role="menuitem">
                  <item.icon size={16} strokeWidth={1.75} />
                  <span>{item.label}</span>
                  {item.badge && <span className="user-menu__badge">{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>

          <div className="user-menu__foot">
            <Link to="/settings" className="user-menu__foot-link" onClick={() => setOpen(false)}>
              账号设置
            </Link>
            <button type="button" className="user-menu__foot-link user-menu__foot-link--danger" onClick={logout}>
              退出登录
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
