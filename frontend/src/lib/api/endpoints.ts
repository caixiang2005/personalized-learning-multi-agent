/**
 * @file endpoints.ts
 * @description 后端 API 路径常量（与后端文档对齐时只改本文件）。
 *
 * 【当前】仅作契约占位，页面未发起请求。
 * 【待同步】联调前与后端确认路径、请求体、响应 JSON 是否与 types/index.ts 一致。
 *
 * 对照表见：frontend/待与后端同步清单.md
 */

/** API 根路径，开发环境通过 Vite 代理，生产环境由部署配置注入 */
export const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export const API = {
  /** 认证 */
  auth: {
    /** POST { email, password } → { token, user } */
    login: `${API_BASE}/auth/login`,
    /** POST { email, code } */
    loginByCode: `${API_BASE}/auth/login/code`,
    /** POST { email } */
    sendCode: `${API_BASE}/auth/send-code`,
    /** POST 刷新 token */
    refresh: `${API_BASE}/auth/refresh`,
    /** POST 退出 */
    logout: `${API_BASE}/auth/logout`,
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
    /** POST SSE 流式发送消息，见 client.streamChat */
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

  /** 未登录访客 Agent（agent-service :8003） */
  agent: {
    /** POST { user_input, session_id } → { code, msg, data: { ai_reply } } */
    unloginChat: `${API_BASE}/agent/unlogin/chat`,
  },
} as const;

/** 登录响应（示例，与后端对齐后修改） */
export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

/** 流式对话 chunk（SSE data 行 JSON） */
export interface StreamChunk {
  type: "text" | "resource" | "done" | "error";
  content?: string;
  resource?: unknown;
  progress?: number;
}

/** 未登录 Agent 对话响应 */
export interface UnloginChatResponse {
  code: number;
  msg: string;
  data: {
    ai_reply: string;
  };
}
