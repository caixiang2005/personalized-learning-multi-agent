/**
 * 统计数字进入视口后递增。
 */
import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";

type Props = {
  value: string;
  active: boolean;
  className?: string;
};

export default function LandingCountUp({ value, active, className = "" }: Props) {
  const reduced = usePrefersReducedMotion();
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? Number(match[1]) : null;
  const suffix = match?.[2] ?? "";
  const [current, setCurrent] = useState(reduced ? target ?? 0 : 0);

  useEffect(() => {
    if (target === null) return;
    if (!active || reduced) {
      setCurrent(target);
      return;
    }

    setCurrent(0);
    const duration = 1100;
    const start = performance.now();

    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setCurrent(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, target]);

  if (target === null) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {current}
      {suffix}
    </span>
  );
}
