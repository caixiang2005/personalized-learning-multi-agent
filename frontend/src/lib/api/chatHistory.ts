/**
 * @file chatHistory.ts
 * @description 学习服务 · 对话历史（队长规划：侧边栏从本服务加载，非 agent-service）。
 *
 * | GET | /api/chat/sessions?course=&keyword= | 历史会话列表 |
 * | GET | /api/chat/sessions/:sessionId/messages | 某会话消息 |
 *
 * 发消息仍走 agent-service POST /api/agent/chat（Redis 多轮上下文，当前暂存约 2h，暂时方案）。
 */

import type { ChatMessage, ChatSession } from "../../types";
import { API, type ApiResponse } from "./endpoints";
import { authHeaders } from "../auth/token";
import type { StoredChatSession } from "../chatSessions";
import { formatSessionTime } from "../chatSessions";

export type ChatHistorySource = "api" | "draft";

export interface ChatSessionListResult {
  sessions: StoredChatSession[];
  source: ChatHistorySource;
}

export interface ChatMessageListResult {
  messages: ChatMessage[];
  source: ChatHistorySource;
}

function mapSessionDto(dto: ChatSession, updatedAtTs?: number): StoredChatSession {
  const ts = updatedAtTs ?? Date.now();
  return {
    sessionId: dto.id,
    title: dto.title,
    course: dto.course,
    updatedAt: dto.updatedAt || formatSessionTime(ts),
    updatedAtTs: ts,
    messages: [],
  };
}

function mapMessageDto(raw: {
  id: string;
  role: string;
  content: string;
  timestamp?: number;
}): ChatMessage {
  return {
    id: raw.id,
    role: raw.role === "assistant" ? "assistant" : "user",
    content: raw.content,
    timestamp: raw.timestamp ?? Date.now(),
    verified: raw.role === "assistant",
  };
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    const json = (await res.json()) as ApiResponse<T>;
    if (json.code !== 200 || json.data == null) return null;
    return json.data;
  } catch {
    return null;
  }
}

/** GET /api/chat/sessions — 学习服务历史列表 */
export async function fetchChatSessions(params?: {
  keyword?: string;
  course?: string;
}): Promise<ChatSessionListResult> {
  const qs = new URLSearchParams();
  if (params?.keyword?.trim()) qs.set("keyword", params.keyword.trim());
  if (params?.course?.trim()) qs.set("course", params.course.trim());
  const query = qs.toString();
  const url = query ? `${API.chat.sessions}?${query}` : API.chat.sessions;

  try {
    const res = await fetch(url, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { sessions: [], source: "draft" };
    const data = await parseJson<ChatSession[]>(res);
    if (!data?.length) return { sessions: [], source: "api" };
    return {
      sessions: data.map((d) => mapSessionDto(d)),
      source: "api",
    };
  } catch {
    return { sessions: [], source: "draft" };
  }
}

/** GET /api/chat/sessions/:sessionId/messages */
export async function fetchChatMessages(sessionId: string): Promise<ChatMessageListResult> {
  try {
    const res = await fetch(API.chat.messages(sessionId), {
      headers: authHeaders(),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { messages: [], source: "draft" };
    const data = await parseJson<
      Array<{ id: string; role: string; content: string; timestamp?: number }>
    >(res);
    if (!data) return { messages: [], source: "draft" };
    return {
      messages: data.map(mapMessageDto),
      source: "api",
    };
  } catch {
    return { messages: [], source: "draft" };
  }
}
