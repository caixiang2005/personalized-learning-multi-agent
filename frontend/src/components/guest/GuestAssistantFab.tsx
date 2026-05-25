/**
 * @file GuestAssistantFab.tsx
 * @description 未登录页右侧悬浮学习助手入口（参考 MOOC 机器人，队长需求）。
 */

import { Bot } from "lucide-react";

interface Props {
  onClick: () => void;
  active?: boolean;
}

export default function GuestAssistantFab({ onClick, active }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`guest-fab ${active ? "guest-fab--active" : ""}`}
      aria-label="打开学习助手对话"
      title="学习引导智能体"
    >
      <span className="guest-fab__ring" />
      <span className="guest-fab__avatar">
        <Bot className="w-7 h-7 text-white" />
      </span>
      <span className="guest-fab__label">AI 助手</span>
    </button>
  );
}
