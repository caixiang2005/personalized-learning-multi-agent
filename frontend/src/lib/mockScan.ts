/**
 * 拍照搜题 Mock 流程（OCR → 解析 → 同类题）
 * 【待同步后端】POST /api/scan/ocr · POST /api/scan/analyze
 */
import type { ScanResult } from "../types";
import { simulateStream } from "./stream";

const MOCK_OCR =
  "已知二叉树的中序遍历为 ABDC，前序遍历为 BADC，求该二叉树的后序遍历结果，并说明构造过程。";

const MOCK_ANALYSIS = `**题目类型**：二叉树 · 遍历与重建

**核心考点**
- 前序 + 中序确定二叉树结构
- 后序遍历的推导规律

**难度评估**：中等 · 适合期末复习阶段`;

const MOCK_STEPS = [
  {
    order: 1,
    title: "确定根节点",
    content: "前序遍历第一个元素 B 为根节点。",
  },
  {
    order: 2,
    title: "划分左右子树",
    content: "在中序 ABDC 中找到 B，左侧 A 为左子树，右侧 DC 为右子树。",
  },
  {
    order: 3,
    title: "递归构造",
    content: "对左子树 {A}、右子树 {D,C} 重复上述过程，直至所有节点归入子树。",
  },
  {
    order: 4,
    title: "写出后序",
    content: "后序遍历顺序：左 → 右 → 根，结果为 A D C B。",
  },
];

const MOCK_SIMILAR = [
  {
    id: "sq1",
    question: "给定前序与中序遍历，写出后序遍历结果。",
    difficulty: "基础" as const,
    knowledgePoint: "二叉树遍历",
  },
  {
    id: "sq2",
    question: "判断两棵二叉树是否同构（结构相同）。",
    difficulty: "中等" as const,
    knowledgePoint: "二叉树结构",
  },
  {
    id: "sq3",
    question: "根据层序与中序重建二叉树并求高度。",
    difficulty: "进阶" as const,
    knowledgePoint: "树的高度",
  },
];

export type ScanPhase = "idle" | "ocr" | "analyze" | "generate" | "done";

export async function runScanPipeline(
  onPhase: (phase: ScanPhase, progress: number) => void,
  onAnalysisChunk: (text: string) => void
): Promise<ScanResult> {
  onPhase("ocr", 0);
  await delay(600);
  onPhase("ocr", 100);

  onPhase("analyze", 0);
  await simulateStream(MOCK_ANALYSIS, (partial) => {
    onAnalysisChunk(partial);
    onPhase("analyze", Math.min(95, Math.round((partial.length / MOCK_ANALYSIS.length) * 100)));
  }, 18);
  onPhase("analyze", 100);

  onPhase("generate", 0);
  for (let i = 1; i <= 3; i++) {
    await delay(400);
    onPhase("generate", Math.round((i / 3) * 100));
  }

  onPhase("done", 100);
  return {
    ocrText: MOCK_OCR,
    knowledgePoints: ["二叉树", "前序遍历", "中序遍历", "后序遍历", "递归构造"],
    analysis: MOCK_ANALYSIS,
    steps: MOCK_STEPS,
    similarQuestions: MOCK_SIMILAR,
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
