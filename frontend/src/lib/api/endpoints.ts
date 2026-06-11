/**
 * @file endpoints.ts
 * @description user-service 路径常量（与 backend/user-service 文档一致）。
 *
 * 对照：backend/user-service/frontend-handoff.md · frontend-api.md
 * 清单：frontend/待与后端同步清单.md
 */

/** API 根路径，开发环境通过 Vite 代理，生产环境由部署配置注入 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

/** 后端统一响应 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
}

export interface UserInfo {
  userId: number;
  email: string;
  username: string;
  registerTime: string | null;
}

export interface LoginData extends UserInfo {
  token: string;
  refreshToken: string;
}

export type RegisterData = UserInfo;

export interface RefreshTokenData {
  newToken: string;
  newRefreshToken?: string;
}

export const API = {
  /** 用户认证 user-service :8001 · /api/user */
  user: {
    sendRegEmailCode: `${API_BASE}/user/sendRegEmailCode`,
    sendLoginEmailCode: `${API_BASE}/user/sendLoginEmailCode`,
    sendResetEmailCode: `${API_BASE}/user/sendResetEmailCode`,
    register: `${API_BASE}/user/register`,
    login: `${API_BASE}/user/login`,
    loginByUsername: `${API_BASE}/user/loginByUsername`,
    loginByEmailCode: `${API_BASE}/user/loginByEmailCode`,
    refreshToken: `${API_BASE}/user/refreshToken`,
    getUserInfo: `${API_BASE}/user/getUserInfo`,
    resetPwd: `${API_BASE}/user/resetPwd`,
    /** GET 个人资料（user_info 表） */
    getProfile: `${API_BASE}/user/getProfile`,
    /** POST 修改个人资料（部分更新） */
    updateProfile: `${API_BASE}/user/updateProfile`,
    /** POST 上传头像 multipart file */
    uploadAvatar: `${API_BASE}/user/uploadAvatar`,
    /** GET 统计概览（可选，未实现时前端 mock） */
    stats: `${API_BASE}/user/stats`,
  },

  /** 用户与学习画像 */
  profile: {
    /** GET 当前用户画像 */
    get: `${API_BASE}/profile`,
    /** PUT 更新画像字段 */
    update: `${API_BASE}/profile`,
    /** POST { note } 用户手动补充学习状态，触发画像重算 */
    patch: `${API_BASE}/profile/patch`,
    /** GET 画像健康度与维度详情 */
    dimensions: `${API_BASE}/profile/dimensions`,
  },

  /** 对话 */
  chat: {
    /** GET 历史会话列表 ?course=&keyword= */
    sessions: `${API_BASE}/chat/sessions`,
    /** GET /:sessionId 某会话消息列表 */
    messages: (sessionId: string) => `${API_BASE}/chat/sessions/${sessionId}/messages`,
    /** POST SSE 流式发送消息 */
    stream: `${API_BASE}/chat/stream`,
    /** POST 消息反馈 { messageId, type: 'useful'|'useless'|'favorite' } */
    feedback: `${API_BASE}/chat/feedback`,
    /** POST 上传附件 multipart */
    upload: `${API_BASE}/chat/upload`,
  },

  /** 学习路径与资源 */
  path: {
    /** GET 当前用户学习路径（阶段+知识点+资源） */
    get: `${API_BASE}/learning-path`,
    /** PUT 资源学习状态 { topicId, resourceId, status } */
    resourceStatus: `${API_BASE}/learning-path/resource-status`,
    /** GET /:resourceId 资源详情（文档/导图/视频元数据） */
    resource: (id: string) => `${API_BASE}/resources/${id}`,
    /** POST 请求生成路径（首页引导提交后） */
    generate: `${API_BASE}/learning-path/generate`,
  },

  /** 练习 */
  exercise: {
    /** GET /:id 题目列表 */
    get: (id: string) => `${API_BASE}/exercises/${id}`,
    /** POST /:id/submit { answers } → 批改结果并更新画像 */
    submit: (id: string) => `${API_BASE}/exercises/${id}/submit`,
  },

  /** 学习效果评估 */
  analytics: {
    /** GET ?range=7|30|custom&from=&to= */
    overview: `${API_BASE}/analytics/overview`,
    /** GET 薄弱点与推荐资源 */
    weakPoints: `${API_BASE}/analytics/weak-points`,
    /** GET 学习方案优化建议 */
    suggestions: `${API_BASE}/analytics/suggestions`,
  },

  /** 内容安全 */
  safety: {
    /** POST { text } 敏感词检测，也可由网关统一处理 */
    check: `${API_BASE}/safety/check`,
  },

  /**
   * Agent 对话（agent-service :8003，Vite 代理 /api/agent）
   * 实现见 backend/agent-service/api/chat.py · unlogin.py
   * 请求封装见 lib/api/agent.ts
   */
  agent: {
    /** POST 登录用户 · 知识库 RAG + Redis 多轮 */
    chat: `${API_BASE}/agent/chat`,
    /** POST 访客 · 最多 3 轮免费 */
    unloginChat: `${API_BASE}/agent/unlogin/chat`,
    /** POST 画像智能体 · 对话抽取学习特征（待 agent-service 实现） */
    profileBuild: `${API_BASE}/agent/profile-build`,
    /** POST 路径规划智能体 · 分阶段路径与资源推送（待 agent-service 实现） */
    pathPlan: `${API_BASE}/agent/path-plan`,
  },
} as const;

/** 流式对话 chunk（SSE data 行 JSON） */
export interface StreamChunk {
  type: "text" | "resource" | "done" | "error";
  content?: string;
  resource?: unknown;
  progress?: number;
}

/** @deprecated 使用 AgentApiEnvelope（lib/api/agent.ts） */
export interface AgentChatResponse {
  code: number;
  msg: string;
  data: {
    ai_reply: string;
  } | null;
}

/** @deprecated 使用 AgentApiEnvelope */
export type UnloginChatResponse = AgentChatResponse;

export type { AgentChatRequestBody, AgentApiEnvelope } from "./agent";
