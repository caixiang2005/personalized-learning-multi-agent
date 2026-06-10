/**
 * @file agentChat.ts
 * @description 登录用户 Agent 对话 · POST /api/agent/chat（agent-service :8003）
 *
 * 对齐 backend/agent-service/api/chat.py：
 *   请求 { user_input, session_id }
 *   响应 { code, msg, data: { ai_reply } }，ai_reply 为 Markdown
 *   多轮上下文由服务端 Redis 按 session_id 维护（TTL 约 2h，暂时方案）
 *
 * VITE_AGENT_CHAT_MOCK=1 强制本地 Mock
 */

import { API } from "./api/endpoints";
import { postAgentChat, AgentApiError } from "./api/agent";
import { simulateStream } from "./stream";

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

export async function sendAgentMessage(
  userInput: string,
  onChunk: (partial: string) => void,
  sessionId?: string
): Promise<AgentChatResult> {
  const sid = sessionId ?? getAgentSessionId();
  const forceMock = import.meta.env.VITE_AGENT_CHAT_MOCK === "1";

  const finish = async (reply: string, usedFallback = false): Promise<AgentChatResult> => {
    await simulateStream(reply, onChunk, 12);
    return { reply, sessionId: sid, usedFallback };
  };

  const mockReply =
    "（本地 Mock）agent-service 未连接。\n\n请在 `backend/agent-service` 目录激活 `.venv` 后执行 `python main.py`（端口 **8003**），然后刷新页面。\n\n你的问题是：\n> " +
    userInput;

  if (forceMock) {
    return finish(mockReply);
  }

  try {
    const json = await postAgentChat(
      API.agent.chat,
      { user_input: userInput, session_id: sid },
      { withAuth: true, timeoutMs: 180_000 }
    );
    return finish(json.data!.ai_reply);
  } catch (err) {
    const msg = err instanceof AgentApiError ? err.message : "请求失败";
    if (err instanceof AgentApiError && (err.code >= 500 || err.code === 408)) {
      return finish(`⚠️ ${msg}`, true);
    }
    return finish(mockReply, true);
  }
}
