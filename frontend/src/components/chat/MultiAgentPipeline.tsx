/**
 * @file MultiAgentPipeline.tsx
 * @description 多智能体协同流水线可视化组件
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Route, FileText, GitBranch, ClipboardList, Film, Code2,
  CheckCircle2, Loader2, AlertCircle, Sparkles,
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
}

interface Props {
  stages: AgentStage[];
  compact?: boolean;
  title?: string;
}

const AGENT_COLORS: Record<string, string> = {
  idle: "text-gray-400 border-gray-200 dark:border-gray-700",
  processing: "text-[var(--scholar-primary)] border-[var(--scholar-primary)]",
  done: "text-green-500 border-green-400",
  error: "text-red-500 border-red-400",
};

const AGENT_BG: Record<string, string> = {
  idle: "bg-gray-50 dark:bg-gray-800/50",
  processing: "bg-[var(--scholar-primary)]/5",
  done: "bg-green-50 dark:bg-green-900/20",
  error: "bg-red-50 dark:bg-red-900/20",
};

export default function MultiAgentPipeline({ stages, compact = false, title }: Props) {
  if (stages.length === 0) return null;

  return (
    <div className="multi-agent-pipeline">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-[var(--scholar-primary)]" />
          <span className="text-xs font-medium text-[var(--scholar-text-secondary)]">{title}</span>
        </div>
      )}

      <div className={`flex items-start ${compact ? "gap-1.5 overflow-x-auto pb-2" : "flex-wrap gap-3"}`}>
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-start gap-0 min-w-0">
            {/* Arrow connector */}
            {index > 0 && (
              <div className="flex items-center pt-3 px-0.5">
                <motion.div
                  className={`w-4 h-0.5 ${stage.status === "processing" ? "bg-[var(--scholar-primary)]" : "bg-gray-300 dark:bg-gray-600"}`}
                  animate={stage.status === "processing" ? { opacity: [0.4, 1, 0.4] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            )}

            {/* Agent card */}
            <motion.div
              layout
              className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-colors min-w-[80px] ${
                compact ? "p-2 min-w-[64px]" : "p-2.5 min-w-[80px]"
              } ${AGENT_COLORS[stage.status]} ${AGENT_BG[stage.status]}`}
              animate={stage.status === "processing" ? { scale: [1, 1.03, 1] } : {}}
              transition={{ duration: 2, repeat: stage.status === "processing" ? Infinity : 0 }}
            >
              {/* Status indicator */}
              <div className="relative">
                {stage.status === "processing" ? (
                  <div className="absolute -top-1 -right-1">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--scholar-primary)] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--scholar-primary)]" />
                    </span>
                  </div>
                ) : stage.status === "done" ? (
                  <CheckCircle2 size={12} className="absolute -top-1 -right-1 text-green-500" />
                ) : stage.status === "error" ? (
                  <AlertCircle size={12} className="absolute -top-1 -right-1 text-red-500" />
                ) : null}

                <stage.icon size={compact ? 16 : 20} strokeWidth={1.75} />
              </div>

              <span className={`font-medium text-center leading-tight ${
                compact ? "text-[10px]" : "text-xs"
              }`}>
                {stage.name}
              </span>

              {stage.status === "processing" && (
                <Loader2 size={compact ? 10 : 12} className="animate-spin text-[var(--scholar-primary)]" />
              )}

              {stage.detail && !compact && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-tight max-w-[80px]">
                  {stage.detail}
                </span>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
