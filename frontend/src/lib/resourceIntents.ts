/**
 * @file resourceIntents.ts
 * @description 五种资源类型的对话意图（跳转 /chat 后由 agent-service 处理）
 */
import type { LearningProfile, ProfileDimension, ResourceType } from "../types";

export const RESOURCE_INTENT_PROMPTS: Record<ResourceType, string> = {
  document: "请帮我生成一份当前学习知识点的讲解文档，结构清晰、适合复习。",
  mindmap: "请帮我梳理当前薄弱知识点的思维导图大纲，用层级列表展示。",
  exercise: "请根据我的学习水平生成 5 道练习题（含答案与解析）。",
  video: "有没有适合我当前学习阶段的视频教程链接？请推荐并说明理由。",
  practice: "请给我一个与当前知识点相关的代码实操案例，含步骤说明。",
};

export function getResourceIntentPrompt(key: string | null): string | null {
  if (!key) return null;
  return RESOURCE_INTENT_PROMPTS[key as ResourceType] ?? null;
}

const LEARNER_DIMENSION_LABELS: { key: ProfileDimension["key"]; label: string }[] = [
  { key: "knowledge", label: "知识掌握" },
  { key: "exercises", label: "习题完成" },
  { key: "focus", label: "专注度" },
  { key: "weakpoints", label: "薄弱点改善" },
  { key: "efficiency", label: "学习效率" },
  { key: "trend", label: "提升趋势" },
];

interface ProfileDraft {
  major: string;
  goal: string;
  level: string;
}

/**
 * 从用户原话累积画像草稿：不臆造专业/目标，只在话里明确提到时才写入
 */
export function bootstrapProfileFromInput(text: string, current: ProfileDraft): ProfileDraft {
  const trimmed = text.trim();
  let { major, goal, level } = current;

  const majorMatch = trimmed.match(/([\u4e00-\u9fa5A-Za-z0-9·\-]+)\s*专业/);
  if (majorMatch) {
    major = `${majorMatch[1].replace(/^我是/, "").trim()}专业`;
  }

  const goalExplicit = trimmed.match(/目标[是为：:\s]+([^，,。\n]+)/);
  if (goalExplicit) {
    goal = goalExplicit[1].trim();
  } else if (/期末/.test(trimmed) && /(\d+)\s*分/.test(trimmed)) {
    const score = trimmed.match(/(\d+)\s*分/)![1];
    goal = `期末考 ${score} 分以上`;
  } else if (/^(学好|学会|掌握|考过|通过)/.test(trimmed) && trimmed.length <= 24) {
    goal = trimmed.replace(/[。！!？?]+$/, "").trim();
  }

  level = level ? `${level}\n${trimmed}` : trimmed;

  return {
    major,
    goal,
    level: level.slice(0, 500),
  };
}

/** 对话画像完成后生成六维结构（数值随对话轮次略增，内容来自用户原话） */
export function finalizeProfileBuild(
  draft: Pick<LearningProfile, "name" | "major" | "goal" | "level">,
  messageCount: number
): Partial<LearningProfile> {
  const depth = Math.min(messageCount, 3);
  const base = 48 + depth * 10;

  const weakMatches = draft.level.match(/[\u4e00-\u9fa5A-Za-z0-9·]{2,12}/g) ?? [];
  const weakKeywords = weakMatches.filter((w) =>
    /树|图|栈|队列|递归|动态|排序|哈希|链表|专业|期末|视频|练习/.test(w)
  );
  const weakPoints = [...new Set(weakKeywords)]
    .slice(0, 4)
    .map((name, i) => ({ name, count: Math.max(1, 10 - i * 2) }));

  const learnerDimensions: ProfileDimension[] = LEARNER_DIMENSION_LABELS.map((d, i) => {
    const offsets: Record<string, number> = {
      knowledge: 0,
      exercises: -6,
      focus: 4,
      weakpoints: -12,
      efficiency: -2,
      trend: 8,
    };
    const value = Math.min(92, Math.max(38, base + (offsets[d.key] ?? 0) + (i % 2 === 0 ? 2 : 0)));
    const level: ProfileDimension["level"] =
      value >= 75 ? "strong" : value >= 55 ? "medium" : "weak";
    return {
      key: d.key,
      label: d.label,
      value,
      level,
      source: "对话画像构建",
      trendDelta: depth * 2 + (i % 3),
    };
  });

  return {
    ...draft,
    updatedAt: new Date().toISOString().slice(0, 10),
    healthScore: Math.min(75, base + 4),
    progress: 0,
    learnerDimensions,
    dimensions: [],
    cognitiveStyle: /视频/.test(draft.level) ? ["偏好视频讲解"] : [],
    weakPoints,
    rhythm: { period: "", duration: "" },
    goalProgress: draft.goal
      ? { label: draft.goal, percent: Math.min(20, depth * 6 + 4) }
      : { label: "", percent: 0 },
  };
}
