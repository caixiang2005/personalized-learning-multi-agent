/**
 * @file useMultiAgent.ts
 * @description 多智能体协同流程管理 Hook
 */
import { useCallback, useRef, useState } from "react";
import type { AgentStage, AgentStatus } from "../components/chat/MultiAgentPipeline";
import { AGENT_TEMPLATES } from "../components/chat/MultiAgentPipeline";
import { Brain } from "lucide-react";

export interface UseMultiAgentOptions {
  autoReset?: boolean;
  resetDelay?: number;
}

export function useMultiAgent(options: UseMultiAgentOptions = {}) {
  const { autoReset = true, resetDelay = 3000 } = options;
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

  const startPipeline = useCallback((agentIds: string[], firstDetail?: string) => {
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
        description: template?.desc,
        detail: index === 0 && firstDetail ? firstDetail : undefined,
        progress: index === 0 ? 10 : 0,
      };
    });
    setStages(newStages);
  }, []);

  const advancePipeline = useCallback((completedId: string, nextId?: string) => {
    setStages(prev => {
      const updated = prev.map(s => {
        if (s.id === completedId) return { ...s, status: "done" as AgentStatus, progress: 100 };
        if (nextId && s.id === nextId) return { ...s, status: "processing" as AgentStatus, progress: 10 };
        return s;
      });

      const allDone = updated.every(s => s.status === "done" || s.status === "error");
      if (allDone && autoReset) {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setStages([]), resetDelay);
      }

      return updated;
    });
  }, [autoReset, resetDelay]);

  const failPipeline = useCallback((failedId: string, errorDetail?: string) => {
    setStages(prev => prev.map(s =>
      s.id === failedId
        ? { ...s, status: "error" as AgentStatus, detail: errorDetail }
        : s
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
