/**
 * @file profileDisplay.ts
 * @description 驾驶舱展示文案：仅使用用户对话画像中的真实字段
 */
import type { ChatMessage, LearningProfile } from "../types";

/** 页头副标题：有专业/目标才展示，不填默认假数据 */
export function formatDashboardSubtitle(profile: LearningProfile): string {
  const parts: string[] = [];
  if (profile.major?.trim()) parts.push(profile.major.trim());
  if (profile.goal?.trim()) parts.push(`目标：${profile.goal.trim()}`);
  if (parts.length) return parts.join(" · ");
  if (profile.updatedAt) return `画像更新于 ${profile.updatedAt}`;
  return "可在「学习画像」查看与补充你的学习背景";
}

/** 画像卡片辅助说明：优先薄弱点，否则用对话摘要最后一行 */
export function formatProfileCardHint(profile: LearningProfile): string {
  const wp = profile.weakPoints?.find((w) => w.name && w.name !== "待练习巩固");
  if (wp?.name) return `薄弱点：${wp.name}`;
  const lines = profile.level?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  if (lines.length) return lines[lines.length - 1]!.slice(0, 56);
  return "进入画像页查看六维雷达";
}

export function getLastUserChatPreview(messages: ChatMessage[]): string | null {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last?.content.trim()) return null;
  const t = last.content.trim();
  return t.length > 52 ? `${t.slice(0, 52)}…` : t;
}
