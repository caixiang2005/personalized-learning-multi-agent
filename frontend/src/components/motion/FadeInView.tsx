/**
 * 滚动/入场渐入 + 可选视差
 */
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  parallax?: number;
  as?: "div" | "section";
};

export default function FadeInView({
  children,
  className = "",
  delay = 0,
  parallax = 0,
  as = "div",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const Tag = motion[as];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [parallax, -parallax]);

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={parallax ? { y } : undefined}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px -6% 0px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
