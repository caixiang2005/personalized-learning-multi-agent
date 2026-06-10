/**
 * @file GuestAssistantFab.tsx
 * @description 未登录页悬浮学习助手入口，支持拖动 reposition。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";

interface Props {
  onClick: () => void;
  active?: boolean;
}

const MARGIN = 12;
const DRAG_THRESHOLD = 8;
const STORAGE_KEY = "guest-fab-position";

function viewportBounds() {
  const vv = window.visualViewport;
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
    offsetLeft: vv?.offsetLeft ?? 0,
    offsetTop: vv?.offsetTop ?? 0,
  };
}

function clampPos(x: number, y: number, el: HTMLElement | null) {
  const rect = el?.getBoundingClientRect();
  const w = rect?.width ?? 56;
  const h = rect?.height ?? 56;
  const { width, height, offsetLeft, offsetTop } = viewportBounds();
  return {
    x: Math.max(MARGIN + offsetLeft, Math.min(x, offsetLeft + width - w - MARGIN)),
    y: Math.max(MARGIN + offsetTop, Math.min(y, offsetTop + height - h - MARGIN)),
  };
}

function defaultPos(el: HTMLElement | null) {
  const rect = el?.getBoundingClientRect();
  const w = rect?.width ?? 56;
  const h = rect?.height ?? 56;
  const { width, height, offsetLeft, offsetTop } = viewportBounds();
  return {
    x: offsetLeft + width - w - MARGIN,
    y: offsetTop + height - h - MARGIN,
  };
}

export default function GuestAssistantFab({ onClick, active }: Props) {
  const fabRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(
    null
  );

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        setPos(clampPos(parsed.x, parsed.y, fabRef.current));
        return;
      }
    } catch {
      /* ignore */
    }
    setPos(defaultPos(fabRef.current));
  }, []);

  useEffect(() => {
    if (!pos) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      /* ignore */
    }
  }, [pos]);

  const handleResize = useCallback(() => {
    setPos((p) => (p ? clampPos(p.x, p.y, fabRef.current) : defaultPos(fabRef.current)));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [handleResize]);

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || !pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (!d.moved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      d.moved = true;
      setDragging(true);
    }

    if (d.moved) {
      setPos(clampPos(d.origX + dx, d.origY + dy, fabRef.current));
    }
  };

  const finishPointer = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (!d.moved) {
      onClick();
    }

    dragRef.current = null;
    setDragging(false);
  };

  return (
    <button
      ref={fabRef}
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      style={
        pos
          ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
          : { right: "1rem", bottom: "1.25rem", left: "auto", top: "auto" }
      }
      className={`guest-fab ${active ? "guest-fab--active" : ""} ${dragging ? "guest-fab--dragging" : ""}`}
      aria-label="打开学习助手对话，可拖动调整位置"
      title="拖动可移动 · 点击打开对话"
    >
      <span className="guest-fab__ring" />
      <span className="guest-fab__avatar">
        <Bot className="w-7 h-7 text-white" />
      </span>
    </button>
  );
}
