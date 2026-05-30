/**
 * 个人信息页 · 前后端接口类型
 * REST 前缀：/api/user/*
 */

/** GET /api/user/profile 响应 data */
export interface UserProfileDto {
  userId: number;
  email: string;
  username: string;
  registerTime: string | null;
  displayName: string;
  major: string;
  goal: string;
  level: string;
  updatedAt: string;
}

/** PUT /api/user/update 请求体 */
export interface UpdateUserProfileDto {
  displayName?: string;
  major?: string;
  goal?: string;
  level?: string;
}

/** GET /api/user/stats 响应 data */
export interface UserStatsDto {
  healthScore: number;
  goalProgress: number;
  pathProgress: number;
  sessionCount: number;
}

/** 统一 API 响应壳（与 user-service 一致） */
export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T;
}
