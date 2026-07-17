/**
 * @file agentChat.ts
 * @description 登录用户 Agent 对话 · agent-service :8003
 *
 * 主路径：POST /api/agent/chat/stream（真实 SSE token 流）
 * 回退：  POST /api/agent/chat（非流式 + simulateStream 打字）
 *
 * VITE_AGENT_CHAT_MOCK=1 强制本地 Mock
 */

import { API } from "./api/endpoints";
import { postAgentChat, AgentApiError } from "./api/agent";
import { recordLearningActivityApi } from "./api/learn";
import { authHeaders } from "./auth/token";
import { readSseJsonEvents, simulateStream } from "./stream";

let pageSessionId: string | null = null;

export function getAgentSessionId(): string {
  if (!pageSessionId) {
    pageSessionId = crypto.randomUUID();
  }
  return pageSessionId;
}

export function setAgentSessionId(sessionId: string): void {
  pageSessionId = sessionId;
}

/** 新对话：新 UUID，后续请求走新的 Redis 会话 */
export function resetAgentSessionId(): string {
  pageSessionId = crypto.randomUUID();
  return pageSessionId;
}

export interface AgentChatResult {
  reply: string;
  sessionId: string;
  usedFallback?: boolean;
}

async function streamAgentReply(
  userInput: string,
  sessionId: string,
  onChunk: (partial: string) => void
): Promise<string> {
  const response = await fetch(API.agent.chatStream, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ user_input: userInput, session_id: sessionId }),
  });

  let fullContent = "";
  for await (const event of readSseJsonEvents(response)) {
    if (event.type === "token") {
      fullContent += (event.content as string) || "";
      onChunk(fullContent);
    } else if (event.type === "done") {
      fullContent = (event.reply as string) || fullContent;
      onChunk(fullContent);
    }
  }

  if (!fullContent.trim()) {
    throw new Error("empty reply");
  }
  return fullContent;
}

export async function sendAgentMessage(
  userInput: string,
  onChunk: (partial: string) => void,
  sessionId?: string
): Promise<AgentChatResult> {
  const sid = sessionId ?? getAgentSessionId();
  const forceMock = import.meta.env.VITE_AGENT_CHAT_MOCK === "1";

  const finishWithTyping = async (
    reply: string,
    usedFallback = false
  ): Promise<AgentChatResult> => {
    await simulateStream(reply, onChunk, 12);
    return { reply, sessionId: sid, usedFallback };
  };

  const mockReply =
    "智能辅导暂时不可用，已切换为本地引导。\n\n你的问题是：\n> " +
    userInput;

  if (forceMock) {
    return finishWithTyping(mockReply);
  }

  try {
    const reply = await streamAgentReply(userInput, sid, onChunk);
    void recordLearningActivityApi("chat").catch(() => {});
    return { reply, sessionId: sid };
  } catch {
    // SSE 不可用 → 非流式 API
  }

  try {
    const json = await postAgentChat(
      API.agent.chat,
      { user_input: userInput, session_id: sid },
      { withAuth: true, timeoutMs: 180_000 }
    );
    void recordLearningActivityApi("chat").catch(() => {});
    return finishWithTyping(json.data!.ai_reply);
  } catch (err) {
    const msg = err instanceof AgentApiError ? err.message : "请求失败";
    if (err instanceof AgentApiError && (err.code >= 500 || err.code === 408)) {
      return finishWithTyping(`⚠️ ${msg}`, true);
    }
    return finishWithTyping(mockReply, true);
  }
}
