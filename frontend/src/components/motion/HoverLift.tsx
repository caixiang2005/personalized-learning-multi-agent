/**
 * 卡片悬浮微动效
 */
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
};

export default function HoverLift({ children, className = "", as = "div" }: Props) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 380, damping: 22 } }}
      whileTap={{ scale: 0.985 }}
    >
      {children}
    </Tag>
  );
}
