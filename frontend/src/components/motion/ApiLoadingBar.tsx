/**
 * 全局 API loading 顶栏
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { subscribeApiLoading } from "../../lib/api/client";

export default function ApiLoadingBar() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeApiLoading(setLoading), []);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[120] h-0.5 origin-left bg-gradient-to-r from-[#165DFF] to-[#36D399]"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 0.92, opacity: 1 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  );
}
