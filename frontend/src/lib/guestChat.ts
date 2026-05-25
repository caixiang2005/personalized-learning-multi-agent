/**
 * @file guestChat.ts
 * @description 未登录访客 Agent 对话，对接 POST /api/agent/unlogin/chat。
 *
 * 接口约定（agent-service :8003）：
 *   - 请求：{ user_input: string, session_id: string(UUID v4) }
 *   - 响应：{ code: 200, msg: "success", data: { ai_reply: string } }
 *   - session_id：页面首次加载生成，刷新页面重新生成；同页多轮保持不变
 *   - 免费体验：最多 3 轮，第 4 轮起 ai_reply 提示登录
 *
 * 设置 VITE_GUEST_CHAT_MOCK=1 可强制使用本地 Mock（后端不可用时演示）。
 */

import { API } from "./api/endpoints";
import type { UnloginChatResponse } from "./api/endpoints";
import { simulateStream } from "./stream";

/** 与后端 MAX_FREE_ROUNDS 保持一致 */
export const GUEST_MAX_FREE_ROUNDS = 3;

/** 每次页面加载（含刷新）生成新 UUID，模块重载后自动重置 */
let pageSessionId: string | null = null;

/** 获取当前页面会话 ID（UUID v4） */
export function getGuestSessionId(): string {
  if (!pageSessionId) {
    pageSessionId = crypto.randomUUID();
  }
  return pageSessionId;
}

export interface GuestChatResult {
  reply: string;
  /** 是否已耗尽免费体验次数 */
  trialExhausted: boolean;
  /** 网络/服务异常时为 true，此时 reply 可能来自 Mock */
  usedFallback?: boolean;
}

/** 根据 ai_reply 判断是否达到体验上限 */
export function isTrialExhaustedReply(text: string): boolean {
  return /免费体验|已经完成了\s*3\s*轮|请登录后/.test(text);
}

const mockReplies: Record<string, string> = {
  default:
    "你好！👋 欢迎使用个性化学习多智能体系统。\n\n我是你的**学习引导智能体**，无需登录即可体验对话。\n\n请问你是什么专业的？学习目标是什么？",
  画像:
    "平台支持**对话式学习画像**：通过自然语言描述专业、目标与薄弱点，自动抽取 **6 个维度**（知识基础、认知风格、易错点等），并随学习动态更新。",
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

async function requestUnloginChat(userInput: string, sessionId: string): Promise<UnloginChatResponse> {
  const res = await fetch(API.agent.unloginChat, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_input: userInput,
      session_id: sessionId,
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const json = (await res.json()) as UnloginChatResponse;
  if (json.code !== 200 || !json.data?.ai_reply) {
    throw new Error(json.msg || "接口返回异常");
  }
  return json;
}

/**
 * 发送访客消息。默认请求后端；失败时回退 Mock（除非 VITE_GUEST_CHAT_MOCK=1 强制 Mock）。
 * @param userRound 当前会话已发送的用户消息轮次（含本条），用于 Mock 限次
 */
export async function sendGuestMessage(
  userInput: string,
  onChunk: (partial: string) => void,
  userRound: number
): Promise<GuestChatResult> {
  const forceMock = import.meta.env.VITE_GUEST_CHAT_MOCK === "1";
  const sessionId = getGuestSessionId();

  const finish = async (reply: string, usedFallback = false): Promise<GuestChatResult> => {
    const trialExhausted = isTrialExhaustedReply(reply);
    await simulateStream(reply, onChunk, 16);
    return { reply, trialExhausted, usedFallback };
  };

  if (forceMock) {
    return finish(pickMockReply(userInput, userRound));
  }

  try {
    const json = await requestUnloginChat(userInput, sessionId);
    const reply = json.data.ai_reply;
    return finish(reply);
  } catch {
    const fallback = pickMockReply(userInput, userRound);
    return finish(fallback, true);
  }
}
