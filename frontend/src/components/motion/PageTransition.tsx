/**
 * 路由级页面切换（轻量淡入，避免与 scholar-page 动画叠加）
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1] as const;

export default function PageTransition() {
  const location = useLocation();
  const reduced = useReducedMotion();

  if (reduced) {
    return <Outlet />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease }}
        className="min-h-0 w-full flex-1 flex flex-col"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
