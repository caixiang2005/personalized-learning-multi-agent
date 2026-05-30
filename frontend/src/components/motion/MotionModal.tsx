/**
 * 弹性弹出模态框
 */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export default function MotionModal({ open, onClose, title, children }: Props) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px] cursor-pointer"
            aria-label="关闭"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="motion-modal-title"
            className="relative w-full max-w-md landing-glass-card p-6 shadow-xl"
            initial={reduced ? false : { opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, scale: 0.92, y: 16 }}
            transition={
              reduced
                ? { duration: 0 }
                : { type: "spring", stiffness: 420, damping: 28, mass: 0.85 }
            }
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 id="motion-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                aria-label="关闭对话框"
              >
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
