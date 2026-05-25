/**
 * @file mockData.ts
 * @description 演示用静态数据。**后端未就绪前，全站依赖本文件。**
 *
 * 【当前 Mock】以下数据在 store 初始化时直接引用，不发起网络请求。
 *
 * 【待同步后端】联调后由接口替代，可删除或仅保留 fallback：
 *   - defaultProfile    → GET /api/profile
 *   - defaultSessions   → GET /api/chat/sessions
 *   - defaultPath       → GET /api/learning-path
 *   - analyticsData     → GET /api/analytics/overview 等
 *
 * 字段结构需与后端 JSON 一致，类型定义见 types/index.ts
 */

import type { LearningProfile, PathStage, ChatSession } from "../types";

/** 【待同步】GET /api/profile — 学习画像（含 6 个维度） */
export const defaultProfile: LearningProfile = {
  name: "学习者",
  major: "计算机科学与技术 - 数据结构",
  goal: "期末考 85 分以上",
  level: "学过一半，薄弱点：二叉树、图算法",
  updatedAt: "2026-05-22",
  healthScore: 78,
  dimensions: [
    { key: "stack", label: "栈与队列", value: 72, level: "medium", source: "基于最近 3 次练习" },
    { key: "tree", label: "二叉树", value: 38, level: "weak", source: "错题集中 12 道" },
    { key: "graph", label: "图算法", value: 45, level: "weak" },
    { key: "sort", label: "排序算法", value: 80, level: "strong" },
    { key: "hash", label: "哈希表", value: 65, level: "medium" },
    { key: "dp", label: "动态规划", value: 55, level: "medium" },
  ],
  cognitiveStyle: ["视觉型", "偏好思维导图", "视频讲解", "边练边学"],
  weakPoints: [
    { name: "二叉树遍历", count: 18 },
    { name: "图的 BFS/DFS", count: 14 },
    { name: "栈的应用", count: 11 },
    { name: "递归边界", count: 9 },
  ],
  progress: 30,
  rhythm: { period: "晚间 20:00-23:00", duration: "单次 45-60 分钟" },
  goalProgress: { label: "数据结构期末复习", percent: 30 },
};

/** 【待同步】GET /api/chat/sessions — 对话历史侧边栏列表 */
export const defaultSessions: ChatSession[] = [
  { id: "1", title: "栈与队列复习", course: "数据结构", updatedAt: "今天" },
  { id: "2", title: "二叉树薄弱点", course: "数据结构", updatedAt: "昨天" },
  { id: "3", title: "图算法入门", course: "数据结构", updatedAt: "3天前" },
];

/** 【待同步】GET /api/learning-path — 阶段 / 知识点 / 资源树 */
export const defaultPath: PathStage[] = [
  {
    id: "s1",
    title: "阶段 1：基础概念",
    description: "掌握核心定义与基本操作",
    topics: [
      {
        id: "t1",
        name: "栈与队列",
        progress: 80,
        resources: [
          { id: "r1", type: "document", title: "栈与队列精讲笔记", description: "Markdown 学习资料", status: "done" },
          { id: "r2", type: "mindmap", title: "栈的应用思维导图", description: "Mermaid 导图", status: "done", mermaid: "graph TD\nA[栈]-->B[LIFO]\nA-->C[应用]" },
          { id: "r3", type: "exercise", title: "栈专项练习 10 题", description: "选择+填空", status: "learning" },
        ],
      },
      {
        id: "t2",
        name: "线性表",
        progress: 60,
        resources: [
          { id: "r4", type: "video", title: "线性表动画讲解", description: "15 分钟视频", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "s2",
    title: "阶段 2：进阶应用",
    description: "树与图的核心算法",
    topics: [
      {
        id: "t3",
        name: "二叉树",
        progress: 25,
        resources: [
          { id: "r5", type: "document", title: "二叉树遍历详解", description: "前中后序+层序", status: "learning" },
          { id: "r6", type: "exercise", title: "二叉树专项 15 题", description: "在线批改", status: "todo" },
          { id: "r7", type: "practice", title: "二叉树可视化实操", description: "在线代码演示", status: "todo" },
        ],
      },
      {
        id: "t4",
        name: "图算法",
        progress: 10,
        resources: [
          { id: "r8", type: "mindmap", title: "BFS/DFS 对比导图", description: "算法选择指南", status: "todo" },
          { id: "r9", type: "video", title: "最短路算法入门", description: "Dijkstra 讲解", status: "todo" },
        ],
      },
    ],
  },
  {
    id: "s3",
    title: "阶段 3：综合练习",
    description: "模拟考试与错题巩固",
    topics: [
      {
        id: "t5",
        name: "期末模拟卷",
        progress: 0,
        resources: [
          { id: "r10", type: "exercise", title: "数据结构模拟卷 A", description: "限时 90 分钟", status: "todo" },
        ],
      },
    ],
  },
];

/** 【待同步】GET /api/analytics/overview、weak-points、suggestions */
export const analyticsData = {
  studyHours: [
    { day: "周一", hours: 1.2 },
    { day: "周二", hours: 0.8 },
    { day: "周三", hours: 1.5 },
    { day: "周四", hours: 2.0 },
    { day: "周五", hours: 1.0 },
    { day: "周六", hours: 2.5 },
    { day: "周日", hours: 1.8 },
  ],
  accuracy: [
    { week: "第1周", rate: 62 },
    { week: "第2周", rate: 68 },
    { week: "第3周", rate: 71 },
    { week: "第4周", rate: 75 },
  ],
  suggestions: [
    "建议增加栈的实操练习，已为你调整下周学习路径",
    "你更偏好视频学习，掌握度提升更快，可多安排视频资源",
    "二叉树与图算法仍是薄弱点，推荐先完成阶段 2 专项练习",
  ],
  /** 【待同步】GET /api/analytics/activity — 近 12 周，按周列 × 星期行排列 */
  activityGrid: (() => {
    const days: { date: string; level: 0 | 1 | 2 | 3 | 4; minutes?: number }[] = [];
    const today = new Date();
    for (let i = 0; i < 12 * 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (12 * 7 - 1 - i));
      const dow = d.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const seed = (d.getDate() + d.getMonth() * 3) % 10;
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (!isWeekend && seed > 2) level = 1;
      if (!isWeekend && seed > 4) level = 2;
      if (!isWeekend && seed > 6) level = 3;
      if (seed > 8) level = 4;
      days.push({
        date: d.toISOString().slice(0, 10),
        level,
        minutes: level * 28 + (seed % 5) * 6,
      });
    }
    return days;
  })(),
};
