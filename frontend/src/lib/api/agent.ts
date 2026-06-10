/**
 * @file agent.ts
 * @description agent-service (:8003) 请求封装，与 backend/agent-service/api 对齐。
 *
 * POST /api/agent/chat         — 登录用户知识库对话
 * POST /api/agent/unlogin/chat — 访客体验（最多 3 轮）
 *
 * 请求体：{ user_input: string, session_id: string }
 * 成功：  { code: 200, msg: "success", data: { ai_reply: string } }
 * 失败：  { code: 500, msg: string, data: null }（HTTP 500 或全局异常）
 */

import { authHeaders } from "../auth/token";

/** 与 api/chat.py · api/unlogin.py ChatRequest 一致 */
export interface AgentChatRequestBody {
  user_input: string;
  session_id: string;
}

/** 与 ChatResponse 一致 */
export interface AgentApiEnvelope {
  code: number;
  msg: string;
  data: {
    ai_reply: string;
  } | null;
}

export class AgentApiError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = "AgentApiError";
    this.code = code;
  }
}

export interface PostAgentChatOptions {
  /** 登录 Chat 传 true，附带 Bearer（后端当前不校验，预留） */
  withAuth?: boolean;
  /** 默认 180000（RAG + 模型较慢） */
  timeoutMs?: number;
}

/**
 * 调用 agent-service 对话接口。
 * @throws AgentApiError code!==200 或网络/超时
 */
export async function postAgentChat(
  url: string,
  body: AgentChatRequestBody,
  options: PostAgentChatOptions = {}
): Promise<AgentApiEnvelope> {
  const { withAuth = false, timeoutMs = 180_000 } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: HeadersInit = {
    ...(withAuth ? authHeaders() : { "Content-Type": "application/json" }),
    "x-session-id": body.session_id,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    let json: AgentApiEnvelope;
    try {
      json = (await res.json()) as AgentApiEnvelope;
    } catch {
      throw new AgentApiError(res.ok ? "响应解析失败" : `HTTP ${res.status}`, res.status);
    }

    if (json.code !== 200 || !json.data?.ai_reply) {
      throw new AgentApiError(
        json.msg || (res.status >= 500 ? "服务器内部错误，请稍后再试" : `HTTP ${res.status}`),
        json.code || res.status
      );
    }

    return json;
  } catch (err) {
    if (err instanceof AgentApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AgentApiError("请求超时，请稍后再试", 408);
    }
    throw new AgentApiError(err instanceof Error ? err.message : "网络异常", 0);
  } finally {
    clearTimeout(timer);
  }
}
