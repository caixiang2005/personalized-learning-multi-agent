/**
 * @file MobileNav.tsx
 * @description 移动端底栏：4 Tab（首页 · 辅导 · 路径 · 成长）
 */
import { useLocation, NavLink } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { MOBILE_NAV, isGrowthPath, isHomePath } from "../../lib/navConfig";
import { resolveTutorNavTarget, isTutorNavActive, TUTOR_CHAT_PATH } from "../../lib/profileGate";
import { useAppStore } from "../../store/useAppStore";

export default function MobileNav() {
  const { pathname } = useLocation();
  const { profile, profileInitialized } = useAppStore();
  const tutorNav = resolveTutorNavTarget(profileInitialized, profile);
  const growthActive = isGrowthPath(pathname) && pathname !== "/profile";

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-gray-200/80 dark:border-gray-700/80 safe-area-pb">
      <div className="flex items-center justify-around h-14 px-2">
        {MOBILE_NAV.map((item) => {
          const { label, icon: Icon } = item;
          const isTutorTab = item.to === TUTOR_CHAT_PATH;
          const to = isTutorTab ? tutorNav.to : item.to;
          const navState = isTutorTab ? tutorNav.state : undefined;
          const end = "end" in item ? item.end : undefined;
          const isGrowthTab = item.to === "/profile";
          const isHomeTab = item.to === "/home";
          return (
            <NavLink
              key={item.to}
              to={to}
              state={navState}
              end={end}
              title={isTutorTab && tutorNav.state?.fromTutorGate ? "需先完成学习画像" : undefined}
              className={() => {
                const active =
                  (isHomeTab && isHomePath(pathname)) ||
                  (isTutorTab
                    ? isTutorNavActive(pathname, profileInitialized, profile)
                    : item.to !== "/home" && pathname.startsWith(item.to)) ||
                  (isGrowthTab && growthActive);
                return `mobile-nav-tab ${active ? "mobile-nav-tab--active" : ""}`;
              }}
            >
              {({ isActive }) => {
                const active =
                  (isHomeTab && isHomePath(pathname)) ||
                  (isTutorTab
                    ? isTutorNavActive(pathname, profileInitialized, profile)
                    : isActive) ||
                  (isGrowthTab && growthActive);
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
