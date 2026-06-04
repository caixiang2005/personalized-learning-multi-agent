/**
 * @file agentChat.ts
 * @description 登录用户 Agent 对话，对接 POST /api/agent/chat（agent-service :8003）。
 *
 * 接口约定：
 *   - 请求：{ user_input: string, session_id: string(UUID v4) }
 *   - 响应：{ code: 200, msg: "success", data: { ai_reply: string } }，ai_reply 为 Markdown
 *   - session_id：首次打开页面生成，刷新页面更新；同页多轮保持不变
 *
 * 设置 VITE_AGENT_CHAT_MOCK=1 可强制本地 Mock。
 */

import { API, type AgentChatResponse } from "./api/endpoints";
import { authHeaders } from "./auth/token";
import { simulateStream } from "./stream";

let pageSessionId: string | null = null;

/** 获取当前页面会话 ID（UUID v4，刷新后重新生成） */
export function getAgentSessionId(): string {
  if (!pageSessionId) {
    pageSessionId = crypto.randomUUID();
  }
  return pageSessionId;
}

export interface AgentChatResult {
  reply: string;
  /** 网络/服务异常时为 true */
  usedFallback?: boolean;
}

async function requestAgentChat(userInput: string, sessionId: string): Promise<AgentChatResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 180_000);

  try {
    const res = await fetch(API.agent.chat, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        user_input: userInput,
        session_id: sessionId,
      }),
      signal: controller.signal,
    });

    const json = (await res.json()) as AgentChatResponse;
    if (json.code !== 200 || !json.data?.ai_reply) {
      throw new Error(json.msg || `HTTP ${res.status}`);
    }
    return json;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("请求超时，请稍后再试");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 发送登录用户消息。后端一次性返回 Markdown，前端用 simulateStream 做打字机展示。
 */
export async function sendAgentMessage(
  userInput: string,
  onChunk: (partial: string) => void
): Promise<AgentChatResult> {
  const forceMock = import.meta.env.VITE_AGENT_CHAT_MOCK === "1";
  const sessionId = getAgentSessionId();

  const finish = async (reply: string, usedFallback = false): Promise<AgentChatResult> => {
    await simulateStream(reply, onChunk, 12);
    return { reply, usedFallback };
  };

  const mockReply =
    "（本地 Mock）agent-service 未连接。\n\n请在后端虚拟环境中启动 `agent-service`（端口 **8003**），然后刷新页面。\n\n你的问题是：\n> " +
    userInput;

  if (forceMock) {
    return finish(mockReply);
  }

  try {
    const json = await requestAgentChat(userInput, sessionId);
    return finish(json.data!.ai_reply);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "请求失败";
    if (/服务器内部错误|500|繁忙|请求超时/.test(msg)) {
      return finish(`⚠️ ${msg}`, true);
    }
    return finish(mockReply, true);
  }
}
