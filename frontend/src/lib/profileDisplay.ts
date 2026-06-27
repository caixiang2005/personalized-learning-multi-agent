/**
 * @file profileDisplay.ts
 * @description 驾驶舱展示文案：仅使用用户对话画像中的真实字段
 */
import type { ChatMessage, LearningProfile } from "../types";

const LEVEL_STAMP_RE = /^\[\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?\]\s*/;

/** ISO 或带 T 的时间戳 → 可读「YYYY-MM-DD HH:mm」 */
export function formatProfileUpdatedAt(raw?: string): string {
  if (!raw?.trim()) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return raw.replace("T", " ").slice(0, 16);
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** level 字段最后一条笔记（去掉时间戳前缀） */
export function formatLatestLevelNote(level?: string, maxLen = 56): string {
  const lines = level?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  if (!lines.length) return "";
  const text = lines[lines.length - 1]!.replace(LEVEL_STAMP_RE, "").trim();
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** 画像页副标题 */
export function formatProfilePageSubtitle(profile: LearningProfile): string {
  const parts: string[] = [];
  if (profile.major?.trim()) parts.push(profile.major.trim());
  if (profile.goal?.trim()) parts.push(`目标：${profile.goal.trim()}`);
  const note = formatLatestLevelNote(profile.level, 40);
  if (note && !parts.some((p) => p.includes(note))) parts.push(note);
  const updated = formatProfileUpdatedAt(profile.updatedAt);
  if (updated) parts.push(`更新 ${updated}`);
  return parts.join(" · ") || "可在下方补充学习进展，触发六维画像动态更新";
}

/** 页头副标题：有专业/目标才展示，不填默认假数据 */
export function formatDashboardSubtitle(profile: LearningProfile): string {
  const parts: string[] = [];
  if (profile.major?.trim()) parts.push(profile.major.trim());
  if (profile.goal?.trim()) parts.push(`目标：${profile.goal.trim()}`);
  if (parts.length) return parts.join(" · ");
  const updated = formatProfileUpdatedAt(profile.updatedAt);
  if (updated) return `画像更新于 ${updated}`;
  return "可在「学习画像」查看与补充你的学习背景";
}

/** 画像卡片辅助说明：优先薄弱点，否则用对话摘要最后一行 */
export function formatProfileCardHint(profile: LearningProfile): string {
  const wp = profile.weakPoints?.find((w) => w.name && w.name !== "待练习巩固");
  if (wp?.name) return `薄弱点：${wp.name}`;
  const note = formatLatestLevelNote(profile.level);
  if (note) return note;
  return "进入画像页查看六维雷达";
}

export function getLastUserChatPreview(messages: ChatMessage[]): string | null {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last?.content.trim()) return null;
  const t = last.content.trim();
  return t.length > 52 ? `${t.slice(0, 52)}…` : t;
}
