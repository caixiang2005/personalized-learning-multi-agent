/**
 * @file AgentAvatar.tsx
 * @description 学习助手头像：思考中动画、完成勾选状态。
 * @backend 无
 */
import { useEffect, useRef } from "react";
import { Bot, Check } from "lucide-react";
import { animateFloatLoop, pauseAnim, prefersReducedMotion } from "../../lib/anime/motion";

interface Props {
  thinking?: boolean;
  done?: boolean;
  size?: "md" | "sm";
}

export default function AgentAvatar({ thinking, done, size = "md" }: Props) {
  const avatarRef = useRef<HTMLDivElement>(null);
  const box = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const icon = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  useEffect(() => {
    const el = avatarRef.current;
    if (!el || prefersReducedMotion()) return;

    const anim = animateFloatLoop(el);
    return () => pauseAnim(anim);
  }, []);

  return (
    <div
      ref={avatarRef}
      style={{ willChange: "transform" }}
      className={`${box} rounded-full gradient-hero flex items-center justify-center shrink-0 shadow-sm ${
        thinking ? "animate-pulse-soft" : ""
      }`}
    >
      {done ? (
        <Check className={`${icon} text-white`} />
      ) : (
        <Bot className={`${icon} text-white`} />
      )}
    </div>
  );
}
