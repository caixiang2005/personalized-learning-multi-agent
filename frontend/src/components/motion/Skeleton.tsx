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
    <div className="account-shell page-container max-w-5xl space-y-6" aria-busy aria-label="加载中">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-4 w-72 max-w-full" />
      <SkeletonBlock className="h-36 w-full rounded-[0.625rem]" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24 rounded-[0.625rem]" />
        ))}
      </div>
      <div className="grid lg:grid-cols-[1.65fr_1fr] gap-4">
        <SkeletonBlock className="h-96 rounded-[0.625rem]" />
        <SkeletonBlock className="h-72 rounded-[0.625rem]" />
      </div>
    </div>
  );
}
