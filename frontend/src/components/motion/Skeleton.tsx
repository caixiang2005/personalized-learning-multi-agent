/**
 * 加载骨架屏
 */
import { motion } from "framer-motion";

type Props = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: Props) {
  return (
    <motion.div
      className={`rounded-lg bg-gray-200/70 dark:bg-gray-700/50 ${className}`}
      animate={{ opacity: [0.55, 0.95, 0.55] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="account-home" aria-busy aria-label="加载中">
      <SkeletonBlock className="h-36 w-full rounded-[0.625rem] mb-4" />
      <SkeletonBlock className="h-64 w-full rounded-[0.625rem]" />
    </div>
  );
}
