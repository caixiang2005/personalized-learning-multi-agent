/**
 * @file generateLearningPath.ts
 * @description 路径智能体规划结果 · **待后端** POST /api/learning-path/generate
 *
 * 当前：结合学习画像 + 规划对话，本地生成三阶段路径与五类多模态资源占位。
 */
import type { LearningProfile, MultimodalResource, PathStage, LearningPathMeta } from "../types";
import type { PathPlanDraft } from "./pathPlanChat";

function slugId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function defaultTopicsFromProfile(profile: LearningProfile): string[] {
  const fromWeak = profile.weakPoints.map((w) => w.name).filter(Boolean);
  if (fromWeak.length >= 2) return fromWeak.slice(0, 4);

  const course = profile.major || "专业核心课";
  if (/数据结构|算法|计算机|软件/.test(course)) {
    return ["线性表与栈队列", "树与二叉树", "图与最短路", "综合练习"];
  }
  if (/人工智能|机器学习|AI/.test(course)) {
    return ["Python 与 NumPy", "线性模型", "神经网络基础", "项目实战"];
  }
  return [`${course} · 基础概念`, `${course} · 核心模块`, `${course} · 综合应用`];
}

function buildResources(topicName: string, stageIndex: number, topicIndex: number): MultimodalResource[] {
  const base = stageIndex * 10 + topicIndex;
  const templates: Omit<MultimodalResource, "id">[] = [
    {
      type: "document",
      title: `${topicName} · 精讲文档`,
      description: "路径智能体推送 · 课程讲解文档",
      status: stageIndex === 0 && topicIndex === 0 ? "learning" : "todo",
    },
    {
      type: "mindmap",
      title: `${topicName} · 知识导图`,
      description: "Mermaid 思维导图",
      status: "todo",
      mermaid: `graph LR\nA[${topicName}]-->B[核心概念]\nA-->C[常见题型]`,
    },
    {
      type: "exercise",
      title: `${topicName} · 巩固题库`,
      description: "自适应练习 · 待批改同步画像",
      status: "todo",
    },
    {
      type: "video",
      title: `${topicName} · 视频讲解`,
      description: "多模态教学视频 / 动画",
      status: "todo",
    },
    {
      type: "practice",
      title: `${topicName} · 实操案例`,
      description: "代码 / 实验类实践材料",
      status: "todo",
    },
  ];

  return templates.map((r, i) => ({
    ...r,
    id: slugId("res", base * 5 + i + 1),
  }));
}

const STAGE_BLUEPRINT = [
  {
    title: "阶段 1：基础巩固",
    description: "对齐知识基础维度，夯实核心概念与基本题型",
  },
  {
    title: "阶段 2：薄弱突破",
    description: "针对画像易错点与认知偏好，强化专项训练",
  },
  {
    title: "阶段 3：综合测评",
    description: "模拟测验与复盘，动态调整后续推送策略",
  },
] as const;

export function generateLearningPath(
  profile: LearningProfile,
  draft: PathPlanDraft,
  _userRounds: number
): { stages: PathStage[]; meta: LearningPathMeta } {
  const topics = defaultTopicsFromProfile(profile);
  const course = draft.courseFocus.trim() || profile.major || "个性化课程";
  const pathId = `lp-${Date.now()}`;

  const stages: PathStage[] = STAGE_BLUEPRINT.map((blueprint, stageIndex) => {
    const topicSlice =
      stageIndex === 0
        ? topics.slice(0, 2)
        : stageIndex === 1
          ? topics.slice(2, 4).length
            ? topics.slice(2, 4)
            : [topics[topics.length - 1] ?? "专项强化"]
          : ["阶段测评与复盘"];

    return {
      id: slugId("stage", stageIndex + 1),
      title: blueprint.title,
      description: draft.priority.trim()
        ? `${blueprint.description} · 重点：${draft.priority.trim()}`
        : blueprint.description,
      topics: topicSlice.map((name, topicIndex) => ({
        id: slugId("topic", stageIndex * 4 + topicIndex + 1),
        name,
        progress: stageIndex === 0 && topicIndex === 0 ? 15 : 0,
        resources: buildResources(name, stageIndex, topicIndex),
      })),
    };
  });

  const meta: LearningPathMeta = {
    id: pathId,
    title: `${course} · 个性化学习路径`,
    course,
    generatedAt: new Date().toISOString().slice(0, 10),
    source: "路径智能体规划",
    overallProgress: 0,
  };

  if (draft.preference.trim()) {
    meta.title = `${course} · ${draft.preference.trim().slice(0, 12)}…`;
  }

  return { stages, meta };
}
