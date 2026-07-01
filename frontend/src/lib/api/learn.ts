/**
 * @file learn.ts
 * @description learn-service (:8002) API 封装 — 通过 Vite 代理 /api 到达后端。
 *
 * 所有函数返回后端统一响应 { code, msg, data }。
 * 401 时抛出 ApiClientError，由页面自行降级或提示（不再全局跳转 /login）。
 */
import { apiClient } from "./client";
import { API } from "./endpoints";
import { getToken } from "../auth/token";
import { readSseJsonEvents } from "../stream";
import type { DailyPlan, DailyPlanTask, DailyTaskType } from "../../types";

const PLAN_DURATION: Record<string, number> = { high: 30, medium: 20, low: 15 };

function normalizeDailyPlan(raw: Record<string, unknown>): DailyPlan {
  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : []).map((item) => {
    const t = item as Record<string, unknown>;
    const priority = String(t.priority ?? "medium");
    return {
      id: String(t.id ?? ""),
      type: (String(t.type ?? "learn") as DailyTaskType),
      title: String(t.title ?? ""),
      topic: String(t.topic ?? t.description ?? ""),
      durationMin: Number(t.durationMin ?? PLAN_DURATION[priority] ?? 20),
      done: Boolean(t.done),
      progress: Boolean(t.done) ? 100 : Number(t.progress ?? 0),
    } satisfies DailyPlanTask;
  });
  const knowledgePush = (Array.isArray(raw.knowledgePush) ? raw.knowledgePush : []).map(
    (item) => {
      const kp = item as Record<string, unknown>;
      return {
        id: String(kp.id ?? ""),
        title: String(kp.title ?? ""),
        desc: String(kp.desc ?? kp.content ?? ""),
        tag: String(kp.tag ?? kp.category ?? ""),
      };
    }
  );
  return {
    date: String(raw.date ?? ""),
    greeting: String(raw.greeting ?? ""),
    summary: String(raw.summary ?? ""),
    overallProgress: Number(raw.overallProgress ?? 0),
    knowledgePush,
    tasks,
  };
}

// ─── 画像 ───

export function fetchProfile() {
  return apiClient.get(API.profile.get).then((r) => r.data);
}

export function updateProfile(data: Record<string, unknown>) {
  return apiClient.put(API.profile.update, data).then((r) => r.data);
}

export function patchProfileNote(note: string) {
  return apiClient.post(API.profile.patch, { note }).then((r) => r.data);
}

export function fetchProfileDimensions() {
  return apiClient.get(API.profile.dimensions).then((r) => r.data);
}

// ─── 学习路径 ───

export function fetchLearningPath() {
  return apiClient.get(API.path.get).then((r) => r.data);
}

export function updateResourceStatus(
  topicId: string,
  resourceId: string,
  status: string
) {
  return apiClient
    .put(API.path.resourceStatus, { topicId, resourceId, status })
    .then((r) => r.data);
}

export function generateLearningPathApi(body: {
  course: string;
  goal: string;
  stages?: unknown[];
  title?: string;
}) {
  return apiClient.post(API.path.generate, body).then((r) => r.data);
}

// ─── 资源与练习 ───

export function fetchResourceDetail(resourceId: string) {
  return apiClient.get(API.path.resource(resourceId)).then((r) => r.data);
}

export function fetchExercise(exerciseId: string) {
  return apiClient.get(API.exercise.get(exerciseId)).then((r) => r.data);
}

export function submitExerciseApi(
  exerciseId: string,
  answers: Record<string, string>[],
  aiReview?: Record<string, unknown>[],
) {
  return apiClient
    .post(API.exercise.submit(exerciseId), { answers, ai_review: aiReview })
    .then((r) => r.data);
}

/** AI 生成练习题 */
export function generateExerciseApi(params: {
  user_input?: string;
  weak_points?: string[];
  count?: number;
  difficulty?: string;
}) {
  return apiClient
    .post(API.exercise.generate, params)
    .then((r) => r.data);
}

/** AI 智能批改 */
export function aiReviewExerciseApi(
  exerciseId: string,
  questions: Record<string, unknown>[],
  userAnswers: Record<string, unknown>[]
) {
  return apiClient
    .post(API.exercise.aiReview(exerciseId), { questions, user_answers: userAnswers })
    .then((r) => r.data);
}

/** 保存练习结果到数据库（含新字段） */
export function saveExerciseResultApi(params: {
  questions: Record<string, unknown>[];
  answers: Record<string, unknown>[];
  score: number;
  topic_id?: string;
  difficulty?: string;
  ai_review?: Record<string, unknown>[];
  source?: string;
  title?: string;
}) {
  return apiClient
    .post(API.exercise.save, params)
    .then((r) => r.data);
}

/** 练习完成后回写薄弱点与六维画像 */
export function syncExerciseProfileApi(params: {
  score: number;
  questions: Record<string, unknown>[];
  answers: Record<string, unknown>[];
  ai_review?: Record<string, unknown>[];
  topic_id?: string;
}) {
  return apiClient.post(API.exercise.syncProfile, params).then((r) => r.data);
}

/** 获取当前用户的所有练习记录（习题银行） */
export function fetchMyExercises() {
  return apiClient.get(API.exercise.my).then((r) => r.data);
}

// ─── 学习分析 ───

export function fetchAnalyticsOverview(range = 7) {
  return apiClient
    .get(API.analytics.overview, { params: { range } })
    .then((r) => r.data);
}

export function fetchWeakPoints() {
  return apiClient.get(API.analytics.weakPoints).then((r) => r.data);
}

export function fetchSuggestions() {
  return apiClient.get(API.analytics.suggestions).then((r) => r.data);
}

export function fetchAnalyticsActivity(
  opts: { weeks?: number; months?: number; end?: string } = {}
) {
  const params: Record<string, string | number> = {};
  if (opts.months != null) {
    params.months = opts.months;
  } else {
    params.weeks = opts.weeks ?? 12;
  }
  if (opts.end) params.end = opts.end;
  return apiClient
    .get(API.analytics.activity, { params })
    .then((r) => r.data);
}

/** POST /api/analytics/record — 记录学习行为（如 agent 直连辅导） */
export function recordLearningActivityApi(
  activity: "exercise" | "chat" | "path_resource" | "profile_patch",
  extra?: { minutes?: number; exerciseScore?: number; resourceStatus?: string }
) {
  return apiClient
    .post(API.analytics.record, { activity, ...extra }, { skipLoading: true })
    .then((r) => r.data);
}

export function submitChatFeedback(body: {
  messageId: string;
  type: "useful" | "useless" | "favorite";
  sessionId?: string;
}) {
  return apiClient.post(API.chat.feedback, body).then((r) => r.data);
}

// ─── 每日计划 ───

export function fetchDailyPlan() {
  return apiClient.get(API.plan.daily).then((r) => {
    const body = r.data;
    if (body?.code === 200 && body.data) {
      return { ...body, data: normalizeDailyPlan(body.data as Record<string, unknown>) };
    }
    return body;
  });
}

export function toggleTaskApi(taskId: string, done: boolean) {
  return apiClient
    .post(API.plan.toggleTask(taskId), { done })
    .then((r) => {
      const body = r.data;
      if (body?.code === 200 && body.data) {
        return { ...body, data: normalizeDailyPlan(body.data as Record<string, unknown>) };
      }
      return body;
    });
}

// ─── 聊天会话 ───

export function fetchChatSessions() {
  return apiClient.get(API.chatSessions.list).then((r) => r.data);
}

export function fetchSessionMessages(sessionId: string) {
  return apiClient.get(API.chatSessions.messages(sessionId)).then((r) => r.data);
}

export function createChatSession(title: string, course = "") {
  return apiClient
    .post(API.chatSessions.create, { title, course })
    .then((r) => r.data);
}

export function deleteChatSession(sessionId: string) {
  return apiClient.delete(API.chatSessions.delete(sessionId)).then((r) => r.data);
}

export function sendChatMessage(sessionId: string, content: string) {
  return apiClient
    .post(API.chatSessions.send, { session_id: sessionId, content })
    .then((r) => r.data);
}

/** SSE 流式发送消息 — 实时接收多智能体管道进度事件 */
export async function* sendChatMessageStream(
  sessionId: string,
  content: string,
): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const token = getToken();
  const response = await fetch(API.chatSessions.sendStream, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ session_id: sessionId, content }),
  });

  yield* readSseJsonEvents(response);
}

export interface ChatUploadData {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  ocrText?: string;
}

/** POST /api/chat/upload — multipart 附件上传 */
export async function uploadChatAttachment(file: File, sessionId?: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("extract_text", "true");
  if (sessionId) form.append("session_id", sessionId);

  const token = getToken();
  const res = await fetch(API.chat.upload, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = await res.json();
  if (json.code !== 200) {
    throw new Error(json.msg || "上传失败");
  }
  return json as { code: number; msg: string; data: ChatUploadData };
}

/** SSE 重新生成最后一条 AI 回复 */
export async function* regenerateChatStream(
  sessionId: string,
): AsyncGenerator<Record<string, unknown>, void, unknown> {
  const token = getToken();
  const response = await fetch(API.chat.regenerateStream, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ session_id: sessionId }),
  });
  yield* readSseJsonEvents(response);
}

export function regenerateChatMessage(sessionId: string) {
  return apiClient
    .post(API.chat.regenerate, { session_id: sessionId })
    .then((r) => r.data);
}
