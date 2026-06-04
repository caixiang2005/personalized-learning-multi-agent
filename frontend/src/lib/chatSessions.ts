/**
 * @file chatSessions.ts
 * @description 对话会话工具 + 联调前草稿缓存。
 *
 * 队长分工（Redis 2h 为暂时方案，非最终产品承诺）：
 *   - 历史列表 / 消息正文 → 学习服务 GET /api/chat/sessions（待完善，长期持久化）
 *   - 多轮上下文 → agent-service Redis（当前暂存，见 AGENT_CONTEXT_TTL_SEC）
 *   - 本文件 draft 仅在 learning 接口未就绪时保留当前浏览器内的会话草稿
 */

import type { ChatMessage } from "../types";

/** agent-service 当前实现：Redis 多轮上下文 TTL（暂时方案，学习服务完善后可替换） */
export const AGENT_CONTEXT_TTL_SEC = 7200;

/** 侧边栏提示：强调暂时性 */
export const AGENT_CONTEXT_HINT = "多轮上下文当前暂用 Redis（约 2 小时，暂时方案）";
export const HISTORY_SERVICE_HINT = "对话历史将由学习服务持久化加载";

export const CHAT_DRAFT_STORAGE_KEY = "learn-platform-chat-draft";

export interface StoredChatSession {
  /** 与 POST /api/agent/chat 的 session_id 一致 */
  sessionId: string;
  title: string;
  course: string;
  updatedAt: string;
  updatedAtTs: number;
  messages: ChatMessage[];
  /** 联调草稿，学习服务入库后可忽略 */
  draft?: boolean;
}

export interface ChatSessionsSnapshot {
  sessions: StoredChatSession[];
  activeSessionId: string;
}

const DEFAULT_COURSE = "学习对话";

export function formatSessionTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "昨天";
  if (days < 7) return `${days} 天前`;
  return new Date(ts).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

export function titleFromInput(text: string, maxLen = 22): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "新对话";
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}

export function createStoredSession(
  sessionId: string,
  course = DEFAULT_COURSE,
  draft = true
): StoredChatSession {
  const now = Date.now();
  return {
    sessionId,
    title: "新对话",
    course,
    updatedAt: "刚刚",
    updatedAtTs: now,
    messages: [],
    draft,
  };
}

export function loadDraftSessions(): ChatSessionsSnapshot | null {
  try {
    const raw = localStorage.getItem(CHAT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatSessionsSnapshot;
    if (!Array.isArray(parsed.sessions) || !parsed.activeSessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraftSessions(snapshot: ChatSessionsSnapshot): void {
  try {
    localStorage.setItem(CHAT_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

/** 迁移旧 key */
export function migrateLegacyChatStorage(): void {
  const legacy = "learn-platform-chat-sessions";
  if (localStorage.getItem(CHAT_DRAFT_STORAGE_KEY)) return;
  const old = localStorage.getItem(legacy);
  if (!old) return;
  localStorage.setItem(CHAT_DRAFT_STORAGE_KEY, old);
  localStorage.removeItem(legacy);
}

export function stripStreamingMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .filter((m) => m.id !== "welcome")
    .map(({ streaming, ...rest }) => rest);
}

export function deriveSessionTitle(messages: ChatMessage[], current: string): string {
  if (current !== "新对话") return current;
  const firstUser = messages.find((m) => m.role === "user" && m.content.trim());
  return firstUser ? titleFromInput(firstUser.content) : current;
}

export function patchActiveSession(
  snapshot: ChatSessionsSnapshot,
  messages: ChatMessage[],
  course?: string
): ChatSessionsSnapshot {
  const now = Date.now();
  const clean = stripStreamingMessages(messages);
  const sessions = snapshot.sessions.map((s) => {
    if (s.sessionId !== snapshot.activeSessionId) return s;
    return {
      ...s,
      messages: clean,
      title: deriveSessionTitle(clean, s.title),
      course: course ?? s.course,
      updatedAt: formatSessionTime(now),
      updatedAtTs: now,
      draft: true,
    };
  });
  const active = sessions.find((s) => s.sessionId === snapshot.activeSessionId);
  const rest = sessions.filter((s) => s.sessionId !== snapshot.activeSessionId);
  const sorted = active ? [active, ...rest.sort((a, b) => b.updatedAtTs - a.updatedAtTs)] : sessions;
  return { sessions: sorted, activeSessionId: snapshot.activeSessionId };
}

/** 学习服务列表 + 本地草稿合并（同 sessionId 以 API 为准） */
export function mergeApiAndDraft(
  apiSessions: StoredChatSession[],
  draft: ChatSessionsSnapshot | null
): StoredChatSession[] {
  const apiIds = new Set(apiSessions.map((s) => s.sessionId));
  const draftOnly =
    draft?.sessions.filter((s) => !apiIds.has(s.sessionId)).map((s) => ({ ...s, draft: true })) ??
    [];
  return [...apiSessions.map((s) => ({ ...s, draft: false })), ...draftOnly].sort(
    (a, b) => b.updatedAtTs - a.updatedAtTs
  );
}

export function pickActiveId(merged: StoredChatSession[], preferred?: string): string {
  if (preferred && merged.some((s) => s.sessionId === preferred)) return preferred;
  return merged[0]?.sessionId ?? "";
}
