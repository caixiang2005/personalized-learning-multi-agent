/**
 * 学习路径 API 数据 → Zustand store 结构
 */
import type { LearningPathMeta, PathStage } from "../types";

export function parseLearningPathApiData(
  data: Record<string, unknown> | null | undefined
): { stages: PathStage[]; meta: LearningPathMeta } | null {
  if (!data) return null;

  const rawStages = data.stages;
  if (!Array.isArray(rawStages) || rawStages.length === 0) return null;

  const stages = rawStages.map((stage, stageIndex) => {
    const s = stage as Record<string, unknown>;
    const topics = Array.isArray(s.topics) ? s.topics : [];
    return {
      id: String(s.id ?? `stage-${stageIndex + 1}`),
      title: String(s.title ?? `阶段 ${stageIndex + 1}`),
      description: String(s.description ?? ""),
      topics: topics.map((topic, topicIndex) => {
        const t = topic as Record<string, unknown>;
        const resources = Array.isArray(t.resources) ? t.resources : [];
        return {
          id: String(t.id ?? `topic-${stageIndex + 1}-${topicIndex + 1}`),
          name: String(t.name ?? t.title ?? `知识点 ${topicIndex + 1}`),
          progress: Number(t.progress ?? 0),
          resources: resources.map((resource, resourceIndex) => {
            const r = resource as Record<string, unknown>;
            return {
              id: String(r.id ?? `res-${stageIndex + 1}-${topicIndex + 1}-${resourceIndex + 1}`),
              type: (r.type as PathStage["topics"][0]["resources"][0]["type"]) ?? "document",
              title: String(r.title ?? ""),
              description: String(r.description ?? ""),
              status: (r.status as PathStage["topics"][0]["resources"][0]["status"]) ?? "todo",
            };
          }),
        };
      }),
    } satisfies PathStage;
  });

  const source = data.source === "mock" ? "mock" : "路径智能体规划";

  return {
    stages,
    meta: {
      id: String(data.id ?? ""),
      title: String(data.title ?? "个性化学习路径"),
      course: String(data.course ?? ""),
      generatedAt: String(data.generatedAt ?? "").slice(0, 10),
      source,
      overallProgress: Number(data.overallProgress ?? 0),
    },
  };
}
