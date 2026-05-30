/**
 * Framer Motion 数字计数动画
 */
import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  value: number;
  suffix?: string;
  className?: string;
  active?: boolean;
};

export default function MotionCountUp({
  value,
  suffix = "",
  className = "",
  active = true,
}: Props) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setCurrent(value);
      return;
    }
    setCurrent(0);
    const controls = animate(0, value, {
      duration: 1.05,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCurrent(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, active, reduced]);

  return (
    <span className={className}>
      {current}
      {suffix}
    </span>
  );
}
