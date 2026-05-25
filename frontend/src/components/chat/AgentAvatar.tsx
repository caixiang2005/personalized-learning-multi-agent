/**
 * @file AgentAvatar.tsx
 * @description 学习助手头像：思考中动画、完成勾选状态。
 * @backend 无
 */
import { Bot, Check } from "lucide-react";

interface Props {
  thinking?: boolean;
  done?: boolean;
}

export default function AgentAvatar({ thinking, done }: Props) {
  return (
    <div
      className={`w-10 h-10 rounded-full gradient-hero flex items-center justify-center shrink-0 shadow-card ${
        thinking ? "animate-pulse-soft" : ""
      }`}
    >
      {done ? (
        <Check className="w-5 h-5 text-white" />
      ) : (
        <Bot className="w-5 h-5 text-white" />
      )}
    </div>
  );
}
