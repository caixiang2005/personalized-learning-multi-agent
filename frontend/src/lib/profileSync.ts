/**
 * 画像 API 数据规范化（补齐六维 value / label，供雷达图与 store 使用）
 */
import type { LearningProfile, ProfileDimension } from "../types";

const DIMENSION_META: { key: ProfileDimension["key"]; label: string; base: number }[] = [
  { key: "knowledge", label: "知识掌握", base: 50 },
  { key: "exercises", label: "习题完成", base: 46 },
  { key: "focus", label: "专注度", base: 52 },
  { key: "weakpoints", label: "薄弱点改善", base: 42 },
  { key: "efficiency", label: "学习效率", base: 48 },
  { key: "trend", label: "提升趋势", base: 55 },
];

function toLevel(value: number): ProfileDimension["level"] {
  if (value >= 75) return "strong";
  if (value >= 55) return "medium";
  return "weak";
}

function coerceValue(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : fallback;
}

/** 将后端/本地混杂结构规范为 6 项六维画像 */
export function normalizeLearnerDimensions(
  raw: unknown
): ProfileDimension[] {
  const list = Array.isArray(raw) ? raw : [];
  const byKey = new Map<string, ProfileDimension>();

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const key = String(row.key ?? "");
    const meta = DIMENSION_META.find((m) => m.key === key);
    if (!meta) continue;
    const value = coerceValue(row.value, meta.base);
    byKey.set(key, {
      key: meta.key,
      label: String(row.label ?? meta.label),
      value,
      level: (row.level as ProfileDimension["level"]) ?? toLevel(value),
      source: row.source != null ? String(row.source) : undefined,
      trendDelta: row.trendDelta != null ? Number(row.trendDelta) || 0 : undefined,
    });
  }

  return DIMENSION_META.map((meta) => {
    const existing = byKey.get(meta.key);
    if (existing) return existing;
    return {
      key: meta.key,
      label: meta.label,
      value: meta.base,
      level: toLevel(meta.base),
      source: "对话画像构建",
      trendDelta: meta.key === "trend" ? 2 : 0,
    };
  });
}

/** 解析 GET/POST /api/profile 返回的 data */
export function parseProfileApiData(data: unknown): Partial<LearningProfile> | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const learnerDimensions = normalizeLearnerDimensions(
    row.learnerDimensions ?? row.dimensions
  );

  return {
    ...(row as Partial<LearningProfile>),
    learnerDimensions,
    dimensions: learnerDimensions,
    healthScore: coerceValue(row.healthScore, 0),
  };
}

/** 练习提交后合并后端返回的 profile 片段到 store */
export function applyExerciseProfilePatch(
  patch: Record<string, unknown> | null | undefined
): Partial<LearningProfile> | null {
  if (!patch || typeof patch !== "object") return null;
  const dims = patch.learnerDimensions ?? patch.dimensions;
  const learnerDimensions = dims ? normalizeLearnerDimensions(dims) : undefined;
  return {
    ...(patch.weakPoints ? { weakPoints: patch.weakPoints as LearningProfile["weakPoints"] } : {}),
    ...(patch.healthScore !== undefined
      ? { healthScore: coerceValue(patch.healthScore, 0) }
      : {}),
    ...(patch.progress !== undefined ? { progress: coerceValue(patch.progress, 0) } : {}),
    ...(patch.updatedAt ? { updatedAt: String(patch.updatedAt) } : {}),
    ...(learnerDimensions ? { learnerDimensions, dimensions: learnerDimensions } : {}),
  };
}
