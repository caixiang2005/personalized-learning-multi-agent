/**
 * @file MobileNav.tsx
 * @description 移动端底栏：4 Tab（首页 · 辅导 · 路径 · 成长）
 */
import { NavLink, useLocation } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { MOBILE_NAV, isGrowthPath } from "../../lib/navConfig";

export default function MobileNav() {
  const { pathname } = useLocation();
  const growthActive = isGrowthPath(pathname) && pathname !== "/profile";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gray-200/80 dark:border-gray-700/80 safe-area-pb">
      <div className="flex items-center justify-around h-14 px-2">
        {MOBILE_NAV.map((item) => {
          const { to, label, icon: Icon } = item;
          const end = "end" in item ? item.end : undefined;
          const isGrowthTab = to === "/profile";
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => {
                const active = isActive || (isGrowthTab && growthActive);
                return `mobile-nav-tab ${active ? "mobile-nav-tab--active" : ""}`;
              }}
            >
              {({ isActive }) => {
                const active = isActive || (isGrowthTab && growthActive);
                return (
                  <>
                    {isGrowthTab && growthActive && !isActive ? (
                      <MoreHorizontal size={20} strokeWidth={2.5} />
                    ) : (
                      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                    )}
                    <span>{label}</span>
                  </>
                );
              }}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
