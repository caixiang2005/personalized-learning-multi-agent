/**
 * @file MultiAgentPipeline.tsx
 * @description 多智能体协同流水线可视化 — 用户可实时看到 AI 思考过程
 */
import { motion } from "framer-motion";
import {
  Brain, Route, FileText, GitBranch, ClipboardList, Film, Code2,
  CheckCircle2, Loader2, AlertCircle, Sparkles, Search, BookOpen, Lightbulb,
  Database,
  type LucideIcon,
} from "lucide-react";

export type AgentStatus = "idle" | "processing" | "done" | "error";

export interface AgentStage {
  id: string;
  name: string;
  icon: LucideIcon;
  status: AgentStatus;
  description?: string;
  detail?: string;
  progress?: number; // 0-100, 当前阶段进度
}

interface Props {
  stages: AgentStage[];
  compact?: boolean;
  title?: string;
  subtitle?: string;
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "border-gray-200 dark:border-gray-700 text-gray-400",
  processing: "border-blue-400 dark:border-blue-500 text-blue-600 dark:text-blue-400",
  done: "border-green-400 dark:border-green-500 text-green-600 dark:text-green-400",
  error: "border-red-400 dark:border-red-500 text-red-600 dark:text-red-400",
};

const STATUS_BG: Record<AgentStatus, string> = {
  idle: "bg-gray-50 dark:bg-gray-800/30",
  processing: "bg-blue-50 dark:bg-blue-900/20",
  done: "bg-green-50 dark:bg-green-900/20",
  error: "bg-red-50 dark:bg-red-900/20",
};

export const AGENT_TEMPLATES: Record<string, { name: string; icon: LucideIcon; desc: string }> = {
  // 真实 Agent 管道阶段（agent-service SSE 推送）
  search: { name: "知识检索", icon: Search, desc: "向量化 · PGVector 搜索知识库" },
  context: { name: "上下文构建", icon: BookOpen, desc: "加载对话历史 · 拼接知识参考" },
  generate: { name: "AI 生成", icon: Sparkles, desc: "DeepSeek 流式生成回答" },
  memory: { name: "记忆存储", icon: Database, desc: "Redis 保存对话记忆" },
  // 其他智能体模板
  profile: { name: "画像分析", icon: Brain, desc: "分析学习特征与薄弱点" },
  path: { name: "路径规划", icon: Route, desc: "规划最佳学习路径" },
  document: { name: "文档生成", icon: FileText, desc: "生成结构化讲解文档" },
  mindmap: { name: "思维导图", icon: GitBranch, desc: "构建知识体系导图" },
  exercise: { name: "题库生成", icon: ClipboardList, desc: "生成针对性练习题" },
  video: { name: "资源匹配", icon: Film, desc: "匹配视频与多媒体资源" },
  practice: { name: "实操案例", icon: Code2, desc: "生成代码实操案例" },
  review: { name: "内容审核", icon: Lightbulb, desc: "审核生成内容的质量" },
};

export default function MultiAgentPipeline({ stages, compact = false, title, subtitle }: Props) {
  if (stages.length === 0) return null;

  const processingCount = stages.filter(s => s.status === "processing").length;
  const doneCount = stages.filter(s => s.status === "done").length;
  const errorCount = stages.filter(s => s.status === "error").length;
  const totalProgress = stages.length > 0
    ? Math.round((doneCount / stages.length) * 100)
    : 0;

  return (
    <div className="multi-agent-pipeline rounded-xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40 p-4 backdrop-blur-sm">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {title || "多智能体协同思考"}
            </span>
          </div>
          {processingCount > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[10px] font-medium text-blue-600 dark:text-blue-400">
              <Loader2 size={10} className="animate-spin" />
              {processingCount} 个运行中
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {subtitle && <span>{subtitle}</span>}
          <span>{doneCount}/{stages.length} 完成</span>
        </div>
      </div>

      {/* 总进度条 */}
      {stages.length > 1 && (
        <div className="mb-3 h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      )}

      {/* 阶段卡片 */}
      <div className={`flex items-start ${compact ? "gap-1.5 overflow-x-auto pb-1" : "flex-wrap gap-2.5"}`}>
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-start gap-0 min-w-0">
            {/* 连接箭头 */}
            {index > 0 && (
              <div className="flex items-center pt-3.5 px-0.5">
                <motion.div
                  className="w-3 h-px bg-gray-300 dark:bg-gray-600"
                  animate={stage.status === "processing"
                    ? { backgroundColor: ["#93c5fd", "#3b82f6", "#93c5fd"] }
                    : stage.status === "done"
                      ? { backgroundColor: "#86efac" }
                      : {}}
                  transition={{ duration: 1.5, repeat: stage.status === "processing" ? Infinity : 0 }}
                />
              </div>
            )}

            {/* Agent 卡片 */}
            <motion.div
              layout
              className={`relative flex flex-col items-center gap-1 rounded-xl border transition-all ${
                compact ? "p-2 min-w-[64px]" : "p-2.5 min-w-[78px]"
              } ${STATUS_COLORS[stage.status]} ${STATUS_BG[stage.status]}`}
              animate={stage.status === "processing"
                ? { boxShadow: ["0 0 0 0 rgba(59,130,246,0)", "0 0 0 2px rgba(59,130,246,0.15)", "0 0 0 0 rgba(59,130,246,0)"] }
                : {}}
              transition={{ duration: 2, repeat: stage.status === "processing" ? Infinity : 0 }}
            >
              {/* 状态图标 */}
              <div className="relative">
                {stage.status === "processing" ? (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                ) : stage.status === "done" ? (
                  <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-green-500" />
                ) : stage.status === "error" ? (
                  <AlertCircle size={12} className="absolute -top-1 -right-1 text-red-500" />
                ) : null}
                <stage.icon size={compact ? 16 : 20} strokeWidth={1.75} />
              </div>

              {/* 名称 */}
              <span className={`font-semibold text-center leading-tight ${
                compact ? "text-[10px]" : "text-[11px]"
              }`}>
                {stage.name}
              </span>

              {/* 进度详情 */}
              {stage.status === "processing" && (
                <div className="flex flex-col items-center gap-0.5 w-full">
                  {stage.detail && (
                    <span className="text-[9px] text-blue-500/70 dark:text-blue-400/70 text-center leading-tight animate-pulse">
                      {stage.detail}
                    </span>
                  )}
                  {stage.progress !== undefined && (
                    <div className="w-full h-0.5 rounded-full bg-gray-200 dark:bg-gray-700 mt-0.5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${stage.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 完成描述 */}
              {stage.status === "done" && stage.description && !compact && (
                <span className="text-[10px] text-green-500/70 dark:text-green-400/70 text-center leading-tight">
                  {stage.description}
                </span>
              )}

              {/* 错误描述 */}
              {stage.status === "error" && stage.detail && !compact && (
                <span className="text-[10px] text-red-400 text-center leading-tight max-w-[80px]">
                  {stage.detail}
                </span>
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* 总结行 */}
      {errorCount > 0 && (
        <p className="mt-2 text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle size={10} /> {errorCount} 个智能体出错，已降级处理
        </p>
      )}
      {processingCount === 0 && doneCount === stages.length && stages.length > 0 && (
        <p className="mt-2 text-[10px] text-green-500 flex items-center gap-1">
          <CheckCircle2 size={10} /> 全部智能体协同完成
        </p>
      )}
    </div>
  );
}
