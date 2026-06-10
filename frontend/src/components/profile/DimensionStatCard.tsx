import { useLayoutEffect, useRef } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { animateProgressBar, pauseAnim, prefersReducedMotion } from "../../lib/anime/motion";
import type { ProfileDimension } from "../../types";

const levelColor = {
  weak: "bg-red-500",
  medium: "bg-amber-400",
  strong: "bg-[var(--scholar-accent)]",
};

export default function DimensionStatCard({
  dimension,
  index = 0,
}: {
  dimension: ProfileDimension;
  index?: number;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const delta = dimension.trendDelta ?? 0;
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendClass =
    delta > 0 ? "text-[var(--scholar-accent)]" : delta < 0 ? "text-red-500" : "text-[var(--scholar-text-muted)]";

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || prefersReducedMotion()) {
      if (bar) bar.style.width = `${dimension.value}%`;
      return;
    }
    const anim = animateProgressBar(bar, dimension.value, index * 80);
    return () => pauseAnim(anim);
  }, [dimension.value, index]);

  return (
    <div className="scholar-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--scholar-text)]">
          <span className={`w-2 h-2 rounded-full shrink-0 ${levelColor[dimension.level]}`} aria-hidden />
          {dimension.label}
        </span>
        <span className="text-lg font-bold text-[var(--scholar-primary)] tabular-nums">
          {dimension.value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[var(--scholar-border)] overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full bg-gradient-to-r from-[var(--scholar-primary)] to-[var(--scholar-accent)]"
          style={{ width: "0%" }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--scholar-text-muted)]">
        <span className="truncate">{dimension.source ?? "基于学习行为分析"}</span>
        <span className={`flex items-center gap-0.5 shrink-0 ${trendClass}`}>
          <TrendIcon size={12} aria-hidden />
          {delta > 0 ? `+${delta}` : delta}
        </span>
      </div>
    </div>
  );
}
