/**
 * 日计划辅助：进度计算 + PlanChatPanel 本地演示文案
 * 主路径：DailyPlan.tsx → GET /api/plan/daily · POST /api/plan/tasks/:id/toggle
 */
import type { DailyPlanTask } from "../types";

export function recalcPlanProgress(tasks: DailyPlanTask[]): number {
  if (!tasks.length) return 0;
  const sum = tasks.reduce((a, t) => a + (t.done ? 100 : t.progress), 0);
  return Math.round(sum / tasks.length);
}

export const PLAN_CHAT_SEED =
  "你好！我是今日学习助手。你可以问我：「二叉树后序遍历怎么记？」或「帮我出 2 道同类题」。";

export const PLAN_CHAT_REPLY =
  "后序遍历口诀：**左 → 右 → 根**。建议先画递归树，再从叶子向上输出。需要我生成 2 道同类练习题吗？";
