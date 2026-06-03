/**
 * AI 每日学习计划 Mock
 * 【待同步后端】GET /api/plan/daily · POST /api/plan/tasks/:id/complete
 */
import type { DailyPlan, DailyPlanTask } from "../types";

const today = () => new Date().toISOString().slice(0, 10);

export function getDefaultDailyPlan(): DailyPlan {
  return {
    date: today(),
    greeting: "今天也要稳步前进",
    summary: "根据你的画像，今日重点攻克二叉树遍历，并完成 2 组巩固练习。",
    overallProgress: 35,
    knowledgePush: [
      {
        id: "kp1",
        title: "二叉树前序 / 中序 / 后序",
        desc: "理解三种遍历顺序及递归实现，15 分钟精讲 + 例题",
        tag: "今日推送",
      },
      {
        id: "kp2",
        title: "根据遍历序列重建二叉树",
        desc: "前序 + 中序确定结构，与搜题模块联动复习",
        tag: "薄弱强化",
      },
    ],
    tasks: [
      {
        id: "t1",
        type: "learn",
        title: "学习：二叉树遍历精讲",
        topic: "数据结构 · 二叉树",
        durationMin: 25,
        done: true,
        progress: 100,
      },
      {
        id: "t2",
        type: "chat",
        title: "对话：向智能体提问 3 个易错点",
        topic: "智能辅导",
        durationMin: 15,
        done: false,
        progress: 40,
      },
      {
        id: "t3",
        type: "exercise",
        title: "练习：二叉树专项 8 题",
        topic: "题库巩固",
        durationMin: 20,
        done: false,
        progress: 0,
      },
    ],
  };
}

export function recalcPlanProgress(tasks: DailyPlanTask[]): number {
  if (!tasks.length) return 0;
  const sum = tasks.reduce((a, t) => a + (t.done ? 100 : t.progress), 0);
  return Math.round(sum / tasks.length);
}

export const PLAN_CHAT_SEED =
  "你好！我是今日学习助手。你可以问我：「二叉树后序遍历怎么记？」或「帮我出 2 道同类题」。";

export const PLAN_CHAT_REPLY =
  "后序遍历口诀：**左 → 右 → 根**。建议先画递归树，再从叶子向上输出。需要我生成 2 道同类练习题吗？";
