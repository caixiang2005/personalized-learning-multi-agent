/**
 * @file guestChat.ts
 * @description 访客 Agent · agent-service :8003
 *
 * 主路径：POST /api/agent/unlogin/chat/stream（SSE token 流）
 * 回退：  POST /api/agent/unlogin/chat + simulateStream
 *
 * VITE_GUEST_CHAT_MOCK=1 强制 Mock
 */

import { API } from "./api/endpoints";
import { postAgentChat, AgentApiError } from "./api/agent";
import { readSseJsonEvents, simulateStream } from "./stream";

export const GUEST_MAX_FREE_ROUNDS = 3;

let pageSessionId: string | null = null;

export function getGuestSessionId(): string {
  if (!pageSessionId) {
    pageSessionId = crypto.randomUUID();
  }
  return pageSessionId;
}

export function resetGuestSessionId(): string {
  pageSessionId = crypto.randomUUID();
  return pageSessionId;
}

export interface GuestChatResult {
  reply: string;
  sessionId: string;
  trialExhausted: boolean;
  usedFallback?: boolean;
}

export function isTrialExhaustedReply(text: string): boolean {
  return /免费体验|已经完成了\s*3\s*轮|请登录后/.test(text);
}

const mockReplies: Record<string, string> = {
  default:
    "你好！👋 欢迎使用个性化学习多智能体系统。\n\n我是你的**学习引导智能体**，无需登录即可体验对话。\n\n请问你是什么专业的？学习目标是什么？",
  画像:
    "平台支持**对话式学习画像**：通过自然语言描述专业、目标与薄弱点，自动抽取 **6 个维度**，并随学习动态更新。",
  智能体:
    "系统采用**多智能体协同**，可生成文档、思维导图、题库、视频脚本、实操案例等多模态资源。登录后可完整体验。",
  路径: "登录并描述学习背景后，**路径规划智能体**会结合画像推送阶段性学习路径与配套资源。",
  exhausted:
    "✅ 你已经完成了 3 轮免费体验！\n\n登录后可以享受完整功能：\n1. 构建完整的 6 维度动态学习画像\n2. 生成包含文档、思维导图、题库等完整资源\n3. 永久保存学习进度和数据\n\n请登录后继续使用吧！",
};

function pickMockReply(input: string, userRound: number): string {
  if (userRound > GUEST_MAX_FREE_ROUNDS) return mockReplies.exhausted;
  if (/画像|维度|profile/i.test(input)) return mockReplies.画像;
  if (/智能体|agent|资源|生成/i.test(input)) return mockReplies.智能体;
  if (/路径|规划|课程|数据结构|python|专业/i.test(input)) return mockReplies.路径;
  return mockReplies.default;
}

async function streamGuestReply(
  userInput: string,
  sessionId: string,
  onChunk: (partial: string) => void
): Promise<string> {
  const response = await fetch(API.agent.unloginChatStream, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

export async function sendGuestMessage(
  userInput: string,
  onChunk: (partial: string) => void,
  userRound: number
): Promise<GuestChatResult> {
  const forceMock = import.meta.env.VITE_GUEST_CHAT_MOCK === "1";
  const sessionId = getGuestSessionId();

  const finishWithTyping = async (
    reply: string,
    usedFallback = false
  ): Promise<GuestChatResult> => {
    await simulateStream(reply, onChunk, 16);
    return {
      reply,
      sessionId,
      trialExhausted: isTrialExhaustedReply(reply),
      usedFallback,
    };
  };

  if (forceMock) {
    return finishWithTyping(pickMockReply(userInput, userRound));
  }

  try {
    const reply = await streamGuestReply(userInput, sessionId, onChunk);
    return {
      reply,
      sessionId,
      trialExhausted: isTrialExhaustedReply(reply),
    };
  } catch {
    /* SSE 不可用 → 非流式 */
  }

  try {
    const json = await postAgentChat(
      API.agent.unloginChat,
      { user_input: userInput, session_id: sessionId },
      { withAuth: false, timeoutMs: 90_000 }
    );
    return finishWithTyping(json.data!.ai_reply);
  } catch (err) {
    const msg = err instanceof AgentApiError ? err.message : "请求失败";
    if (err instanceof AgentApiError && (err.code >= 500 || err.code === 408)) {
      return finishWithTyping(`⚠️ ${msg}`, true);
    }
    return finishWithTyping(pickMockReply(userInput, userRound), true);
  }
}
