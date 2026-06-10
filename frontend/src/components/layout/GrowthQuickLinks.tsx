/**
 * @file GrowthQuickLinks.tsx
 * @description 成长档案子入口（画像页快捷跳转评估 / 工具）
 */
import { Link, useLocation } from "react-router-dom";
import { GROWTH_NAV } from "../../lib/navConfig";
import AnimeStagger from "../motion/AnimeStagger";

export default function GrowthQuickLinks() {
  const { pathname } = useLocation();
  const links = GROWTH_NAV.filter((i) => i.to !== pathname);

  return (
    <AnimeStagger
      as="nav"
      className="growth-quick-links"
      aria-label="成长档案相关页面"
      staggerMs={60}
      y={10}
    >
      {links.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={`growth-quick-links__item ${pathname === to ? "growth-quick-links__item--active" : ""}`}
        >
          <Icon size={14} strokeWidth={1.75} />
          {label}
        </Link>
      ))}
    </AnimeStagger>
  );
}
