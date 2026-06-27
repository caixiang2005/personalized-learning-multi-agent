/**
 * @file index.ts
 * @description 前后端共用的数据结构类型定义。
 *
 * 联调时把后端 JSON 字段与下列 interface 逐项对齐；
 * 大部分结构已与 learn-service 对齐，变更时请同步 OpenAPI。
 */
export type ResourceType =
  | "document"
  | "mindmap"
  | "exercise"
  | "video"
  | "practice";

export type ResourceStatus = "todo" | "learning" | "done" | "mastered" | "favorite";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  verified?: boolean;
  resources?: MultimodalResource[];
  attachments?: ChatAttachment[];
  timestamp: number;
}

export interface ChatAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  /** 本地预览 URL（blob:） */
  previewUrl?: string;
  ocrText?: string;
}

export interface MultimodalResource {
  id: string;
  type: ResourceType;
  title: string;
  description: string;
  progress?: number;
  status?: ResourceStatus;
  content?: string;
  mermaid?: string;
}

export interface ProfileDimension {
  key: string;
  label: string;
  value: number;
  level: "weak" | "medium" | "strong";
  source?: string;
  /** 较上周变化，用于提升趋势等维度 */
  trendDelta?: number;
}

/** 六维学习画像（比赛规范） */
export type LearnerDimensionKey =
  | "knowledge"
  | "exercises"
  | "focus"
  | "weakpoints"
  | "efficiency"
  | "trend";

export interface ScanStep {
  order: number;
  title: string;
  content: string;
}

export interface SimilarQuestion {
  id: string;
  question: string;
  difficulty: "基础" | "中等" | "进阶";
  knowledgePoint: string;
}

export interface ScanResult {
  ocrText: string;
  knowledgePoints: string[];
  analysis: string;
  steps: ScanStep[];
  similarQuestions: SimilarQuestion[];
}

export type DailyTaskType = "learn" | "chat" | "exercise";

export interface DailyPlanTask {
  id: string;
  type: DailyTaskType;
  title: string;
  topic: string;
  durationMin: number;
  done: boolean;
  progress: number;
}

export interface DailyPlan {
  date: string;
  greeting: string;
  summary: string;
  overallProgress: number;
  knowledgePush: { id: string; title: string; desc: string; tag: string }[];
  tasks: DailyPlanTask[];
}

export interface LearningProfile {
  name: string;
  major: string;
  goal: string;
  level: string;
  updatedAt: string;
  healthScore: number;
  /** 知识点维度（对话/练习抽取） */
  dimensions: ProfileDimension[];
  /** 六维学习画像（比赛雷达图） */
  learnerDimensions: ProfileDimension[];
  cognitiveStyle: string[];
  weakPoints: { name: string; count: number }[];
  progress: number;
  rhythm: { period: string; duration: string };
  goalProgress: { label: string; percent: number };
}

export interface PathStage {
  id: string;
  title: string;
  description: string;
  topics: PathTopic[];
}

/** 学习路径元信息 · GET /api/learning-path */
export interface LearningPathMeta {
  id: string;
  title: string;
  course: string;
  generatedAt: string;
  source: "路径智能体规划" | "mock";
  overallProgress: number;
}

export interface PathTopic {
  id: string;
  name: string;
  progress: number;
  resources: MultimodalResource[];
}

export interface ChatSession {
  id: string;
  title: string;
  course: string;
  updatedAt: string;
}
