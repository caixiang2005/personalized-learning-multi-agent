/**
 * @file learn.ts
 * @description learn-service (:8002) API 封装 — 通过 Vite 代理 /api 到达后端。
 *
 * 所有函数返回后端统一响应 { code, msg, data }。
 * 401 时 client.ts 的拦截器会自动清除 token 并跳转登录。
 */
import { apiClient } from "./client";
import { API } from "./endpoints";

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

export function generateLearningPathApi(course: string, goal: string) {
  return apiClient
    .post(API.path.generate, { course, goal })
    .then((r) => r.data);
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
  answers: Record<string, string>[]
) {
  return apiClient
    .post(API.exercise.submit(exerciseId), { answers })
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

// ─── 每日计划 ───

export function fetchDailyPlan() {
  return apiClient.get(API.plan.daily).then((r) => r.data);
}

export function toggleTaskApi(taskId: string, done: boolean) {
  return apiClient
    .post(API.plan.toggleTask(taskId), { done })
    .then((r) => r.data);
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
