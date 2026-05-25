/**
 * @file client.ts
 * @description 后端 HTTP / SSE 请求封装（已写好，**当前项目未使用**）。
 *
 * 【重要】后端尚未提供接口前：
 *   - 请勿在页面中 import 本文件，否则 fetch 会 404。
 *   - 各页面继续使用 mockData、mockApi、simulateStream。
 *
 * 【待同步后端】联调步骤：
 *   1. 确认 BACKEND_INTEGRATION.md / 待与后端同步清单.md 中路径与字段
 *   2. 配置 .env.development 与 vite 代理
 *   3. 在对应页面把 Mock 替换为本文件导出的函数
 *
 * 函数与接口对照见各函数上方注释。
 */

import { API } from "./endpoints";
import type { LoginResponse, StreamChunk } from "./endpoints";
import type { ChatMessage, LearningProfile, PathStage, ChatSession } from "../../types";

/** 【待同步】登录成功后后端返回 token，前端写入此处，后续请求自动带上 */
function getToken(): string | null {
  return localStorage.getItem("access_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ═══════════════════════════════════════════════════════════════════
// 认证 — 替换 Login.tsx 中的 mockApi
// ═══════════════════════════════════════════════════════════════════

/**
 * 【待同步后端】POST /api/auth/login 或 /api/auth/login/code
 * 替换：Login.tsx → submitPwdLogin / submitCodeLogin
 */
export async function loginApi(body: { email: string; password?: string; code?: string }): Promise<LoginResponse> {
  const url = body.code ? API.auth.loginByCode : API.auth.login;
  const res = await fetch(url, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "登录失败");
  const data: LoginResponse = await res.json();
  localStorage.setItem("access_token", data.token);
  return data;
}

/**
 * 【待同步后端】POST /api/auth/send-code
 * 替换：Login.tsx → getCode
 */
export async function sendCodeApi(email: string): Promise<void> {
  await fetch(API.auth.sendCode, { method: "POST", headers: authHeaders(), body: JSON.stringify({ email }) });
}

// ═══════════════════════════════════════════════════════════════════
// 学习画像 — 替换 mockData.defaultProfile
// ═══════════════════════════════════════════════════════════════════

/**
 * 【待同步后端】GET /api/profile
 * 替换：进入 Profile/Chat/Home 时从 store 初始化；useAppStore 或页面 useEffect 拉取
 */
export async function fetchProfile(): Promise<LearningProfile> {
  const res = await fetch(API.profile.get, { headers: authHeaders() });
  if (!res.ok) throw new Error("获取画像失败");
  return res.json();
}

/**
 * 【待同步后端】POST /api/profile/patch  body: { note: string }
 * 替换：Profile.tsx → handleUpdate
 */
export async function patchProfile(note: string): Promise<LearningProfile> {
  const res = await fetch(API.profile.patch, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ note }),
  });
  if (!res.ok) throw new Error("更新画像失败");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 对话 — 替换 stream.ts + 本地 messages
// ═══════════════════════════════════════════════════════════════════

/**
 * 【待同步后端】GET /api/chat/sessions
 * 替换：Chat.tsx 挂载时写入 store.sessions（现为 mockData.defaultSessions）
 */
export async function fetchChatSessions(params?: { course?: string; keyword?: string }): Promise<ChatSession[]> {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  const res = await fetch(`${API.chat.sessions}?${q}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("获取会话列表失败");
  return res.json();
}

/**
 * 【待同步后端】GET /api/chat/sessions/:sessionId/messages
 * 替换：Chat.tsx 切换 activeSession 时加载历史消息
 */
export async function fetchMessages(sessionId: string): Promise<ChatMessage[]> {
  const res = await fetch(API.chat.messages(sessionId), { headers: authHeaders() });
  if (!res.ok) throw new Error("获取消息失败");
  return res.json();
}

/**
 * 【待同步后端】POST /api/chat/stream（SSE）
 * 替换：Chat.tsx → sendMessage 中的 simulateStream
 * 返回 abort 函数用于组件卸载时取消请求
 */
export function streamChat(
  payload: { sessionId?: string; content: string; attachments?: string[] },
  handlers: {
    onChunk: (text: string) => void;
    onResource?: (resource: StreamChunk["resource"]) => void;
    onProgress?: (percent: number) => void;
    onDone: () => void;
    onError: (err: Error) => void;
  }
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(API.chat.stream, {
        method: "POST",
        headers: { ...authHeaders(), Accept: "text/event-stream" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error("流式请求失败");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = JSON.parse(line.slice(5).trim()) as StreamChunk;
          if (data.type === "text" && data.content) handlers.onChunk(data.content);
          if (data.type === "resource" && data.resource) handlers.onResource?.(data.resource);
          if (data.progress != null) handlers.onProgress?.(data.progress);
          if (data.type === "done") handlers.onDone();
          if (data.type === "error") throw new Error(data.content ?? "生成失败");
        }
      }
      handlers.onDone();
    } catch (e) {
      if ((e as Error).name !== "AbortError") handlers.onError(e as Error);
    }
  })();

  return () => controller.abort();
}

/**
 * 【待同步后端】POST /api/chat/feedback
 * 替换：MessageBubble.tsx 有用/没用/收藏按钮
 */
export async function sendMessageFeedback(messageId: string, type: string): Promise<void> {
  await fetch(API.chat.feedback, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ messageId, type }),
  });
}

// ═══════════════════════════════════════════════════════════════════
// 学习路径与资源
// ═══════════════════════════════════════════════════════════════════

/**
 * 【待同步后端】GET /api/learning-path
 * 替换：store 初始 pathStages（现为 mockData.defaultPath）
 */
export async function fetchLearningPath(): Promise<PathStage[]> {
  const res = await fetch(API.path.get, { headers: authHeaders() });
  if (!res.ok) throw new Error("获取学习路径失败");
  return res.json();
}

/**
 * 【待同步后端】PUT /api/learning-path/resource-status
 * 替换：LearningPath.tsx → cycleStatus
 */
export async function updateResourceStatusApi(topicId: string, resourceId: string, status: string): Promise<void> {
  await fetch(API.path.resourceStatus, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ topicId, resourceId, status }),
  });
}

/**
 * 【待同步后端】GET /api/resources/:id
 * 替换：ResourceDetail.tsx 中 findResourceById 本地查找
 */
export async function fetchResourceDetail(id: string): Promise<unknown> {
  const res = await fetch(API.path.resource(id), { headers: authHeaders() });
  if (!res.ok) throw new Error("资源不存在");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 练习
// ═══════════════════════════════════════════════════════════════════

/**
 * 【待同步后端】GET /api/exercises/:id
 * 替换：ExercisePage.tsx 内 mockQuestions
 */
export async function fetchExercise(id: string): Promise<unknown> {
  const res = await fetch(API.exercise.get(id), { headers: authHeaders() });
  if (!res.ok) throw new Error("练习不存在");
  return res.json();
}

/**
 * 【待同步后端】POST /api/exercises/:id/submit
 * 替换：ExercisePage.tsx → handleSubmit；响应应含得分、解析、画像更新字段
 */
export async function submitExercise(id: string, answers: Record<string, string>): Promise<unknown> {
  const res = await fetch(API.exercise.submit(id), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error("提交失败");
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════
// 效果评估
// ═══════════════════════════════════════════════════════════════════

/**
 * 【待同步后端】GET /api/analytics/overview?range=
 * 替换：Analytics.tsx 中 analyticsData 静态图表数据
 */
export async function fetchAnalytics(range: string): Promise<unknown> {
  const res = await fetch(`${API.analytics.overview}?range=${encodeURIComponent(range)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("获取统计数据失败");
  return res.json();
}

/**
 * 【待同步后端】POST /api/safety/check（可选）
 * 替换：stream.ts → checkSensitiveInput 本地关键词
 */
export async function checkSensitiveApi(text: string): Promise<{ ok: boolean; message?: string }> {
  const res = await fetch(API.safety.check, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ text }),
  });
  return res.json();
}
