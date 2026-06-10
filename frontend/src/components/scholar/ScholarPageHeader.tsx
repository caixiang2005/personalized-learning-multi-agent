import type { ReactNode } from "react";
import AnimeReveal from "../motion/AnimeReveal";

type Props = {
  badge?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export default function ScholarPageHeader({ badge, title, subtitle, action }: Props) {
  return (
    <header className="scholar-page-header flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {badge && (
          <AnimeReveal as="p" className="scholar-page-header__badge" y={8} delay={0}>
            {badge}
          </AnimeReveal>
        )}
        <AnimeReveal as="h1" className="scholar-page-header__title" y={12} delay={badge ? 60 : 0}>
          {title}
        </AnimeReveal>
        {subtitle && (
          <AnimeReveal as="p" className="scholar-page-header__sub" y={10} delay={120}>
            {subtitle}
          </AnimeReveal>
        )}
      </div>
      {action && (
        <AnimeReveal className="shrink-0" y={10} delay={160}>
          {action}
        </AnimeReveal>
      )}
    </header>
  );
}
