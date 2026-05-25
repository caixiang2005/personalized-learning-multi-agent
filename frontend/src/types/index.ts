/**
 * @file index.ts
 * @description 前后端共用的数据结构类型定义。
 *
 * 【待同步后端】联调时把后端 JSON 字段与下列 interface 逐项对齐；
 * 若不一致，改本文件或让后端按此返回。尤其 LearningProfile.dimensions 不少于 6 项。
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
  timestamp: number;
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
}

export interface LearningProfile {
  name: string;
  major: string;
  goal: string;
  level: string;
  updatedAt: string;
  healthScore: number;
  dimensions: ProfileDimension[];
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
