/**
 * 路由级页面切换转场（Framer Motion）
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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.38, ease }}
        className="min-h-0"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
