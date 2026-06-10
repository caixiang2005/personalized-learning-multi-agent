/**
 * @file NavGrowthMenu.tsx
 * @description 顶栏「成长档案」下拉：画像、评估 + 辅助工具
 */
import { useCallback, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { GROWTH_NAV, isGrowthPath } from "../../lib/navConfig";

export default function NavGrowthMenu() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const active = isGrowthPath(pathname);

  const openMenu = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 180);
  }, []);

  const coreItems = GROWTH_NAV.filter((i) => i.group === "core");
  const toolItems = GROWTH_NAV.filter((i) => i.group === "tool");

  return (
    <div
      className="nav-growth relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`nav-link nav-growth__trigger inline-flex items-center gap-1 ${active ? "nav-link-active" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        成长档案
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={`nav-growth__chevron ${open ? "nav-growth__chevron--open" : ""}`}
        />
      </button>

      {open && (
        <div className="nav-growth__panel" role="menu">
          <p className="nav-growth__panel-title">核心能力</p>
          {coreItems.map(({ to, label, desc, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              role="menuitem"
              className={({ isActive }) =>
                `nav-growth__item ${isActive ? "nav-growth__item--active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <span className="nav-growth__item-icon">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="nav-growth__item-label">{label}</span>
                <span className="nav-growth__item-desc">{desc}</span>
              </span>
            </NavLink>
          ))}

          <p className="nav-growth__panel-title nav-growth__panel-title--tools">学习工具</p>
          {toolItems.map(({ to, label, desc, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              role="menuitem"
              className={({ isActive }) =>
                `nav-growth__item ${isActive ? "nav-growth__item--active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              <span className="nav-growth__item-icon">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="nav-growth__item-label">{label}</span>
                <span className="nav-growth__item-desc">{desc}</span>
              </span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
