/**
 * 首页协同动态 · 多智能体状态（前端展示，待后端 SSE 联调）
 */
import type { LucideIcon } from "lucide-react";
import { BrainCircuit, Route, MessageSquare, BarChart3, Sparkles } from "lucide-react";

export type AgentStatusKind = "idle" | "working" | "done";

export interface HomeAgentStatus {
  id: string;
  name: string;
  icon: LucideIcon;
  progress: number;
  status: AgentStatusKind;
  message: string;
}

export const HOME_AGENT_STATUS: HomeAgentStatus[] = [
  {
    id: "profile",
    name: "画像智能体",
    icon: BrainCircuit,
    progress: 100,
    status: "done",
    message: "六维画像已就绪，可驱动路径规划",
  },
  {
    id: "path",
    name: "路径智能体",
    icon: Route,
    progress: 62,
    status: "working",
    message: "正在根据薄弱点调整阶段推送策略",
  },
  {
    id: "tutor",
    name: "辅导智能体",
    icon: MessageSquare,
    progress: 0,
    status: "idle",
    message: "等待你的下一个学习问题",
  },
  {
    id: "eval",
    name: "评估智能体",
    icon: BarChart3,
    progress: 28,
    status: "working",
    message: "汇总练习数据，更新掌握度曲线",
  },
  {
    id: "resource",
    name: "资源编排",
    icon: Sparkles,
    progress: 45,
    status: "working",
    message: "协同生成文档、导图与视频推荐",
  },
];
