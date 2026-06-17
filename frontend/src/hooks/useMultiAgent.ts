/**
 * @file useMultiAgent.ts
 * @description 多智能体协同流程管理 Hook
 */
import { useCallback, useRef, useState } from "react";
import type { AgentStage, AgentStatus } from "../components/chat/MultiAgentPipeline";
import { Brain, Route, FileText, GitBranch, ClipboardList, Film, Code2, type LucideIcon } from "lucide-react";

// 预定义的智能体模板
export const AGENT_TEMPLATES: Record<string, { name: string; icon: LucideIcon }> = {
  profile: { name: "画像分析", icon: Brain },
  path: { name: "路径规划", icon: Route },
  document: { name: "文档生成", icon: FileText },
  mindmap: { name: "导图生成", icon: GitBranch },
  exercise: { name: "题库生成", icon: ClipboardList },
  video: { name: "多模态讲解", icon: Film },
  practice: { name: "实操案例", icon: Code2 },
};

export interface UseMultiAgentOptions {
  autoReset?: boolean;       // 完成后自动重置
  resetDelay?: number;       // 自动重置延迟（ms）
}

export function useMultiAgent(options: UseMultiAgentOptions = {}) {
  const { autoReset = false, resetDelay = 3000 } = options;
  const [stages, setStages] = useState<AgentStage[]>([]);
  const timerRef = useRef<number | null>(null);

  const setAgentStatus = useCallback((agentId: string, status: AgentStatus, detail?: string) => {
    setStages(prev => prev.map(s =>
      s.id === agentId ? { ...s, status, detail } : s
    ));
  }, []);

  const setAgentBatch = useCallback((statuses: Record<string, AgentStatus>) => {
    setStages(prev => prev.map(s =>
      statuses[s.id] !== undefined ? { ...s, status: statuses[s.id] } : s
    ));
  }, []);

  const startPipeline = useCallback((agentIds: string[], inputDetail?: string) => {
    // 清除旧定时器
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const newStages: AgentStage[] = agentIds.map((id, index) => {
      const template = AGENT_TEMPLATES[id];
      return {
        id,
        name: template?.name ?? id,
        icon: template?.icon ?? Brain,
        status: (index === 0 ? "processing" : "idle") as AgentStatus,
        detail: index === 0 && inputDetail ? inputDetail : undefined,
      };
    });
    setStages(newStages);
  }, []);

  const advancePipeline = useCallback((completedId: string, nextId?: string) => {
    setStages(prev => {
      const updated = prev.map(s => {
        if (s.id === completedId) return { ...s, status: "done" as AgentStatus };
        if (nextId && s.id === nextId) return { ...s, status: "processing" as AgentStatus };
        return s;
      });

      // 检查是否全部完成
      const allDone = updated.every(s => s.status === "done" || s.status === "error");
      if (allDone && autoReset) {
        timerRef.current = window.setTimeout(() => {
          setStages([]);
        }, resetDelay);
      }

      return updated;
    });
  }, [autoReset, resetDelay]);

  const failPipeline = useCallback((failedId: string, errorDetail?: string) => {
    setStages(prev => prev.map(s =>
      s.id === failedId ? { ...s, status: "error" as AgentStatus, detail: errorDetail } : s
    ));
  }, []);

  const resetPipeline = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStages([]);
  }, []);

  return {
    stages,
    setAgentStatus,
    setAgentBatch,
    startPipeline,
    advancePipeline,
    failPipeline,
    resetPipeline,
  };
}
