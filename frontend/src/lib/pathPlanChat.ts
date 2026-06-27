/**
 * @file pathPlanChat.ts
 * @description 路径规划智能体 · POST /api/agent/path-plan（默认远程）
 *
 * 默认远程 agent；`VITE_PATH_PLAN_API=0` 时走本地引导。
 * 生成路径：`generateLearningPathApi()` 或本地 `generateLearningPath` fallback。
 */
import { API } from "./api/endpoints";
import { postAgentChat, AgentApiError } from "./api/agent";
import { simulateStream } from "./stream";
import type { LearningProfile } from "../types";

export interface PathPlanDraft {
  courseFocus: string;
  priority: string;
  preference: string;
}

export interface PathPlanChatResult {
  reply: string;
  usedFallback?: boolean;
}

function summarizeDraft(draft: PathPlanDraft, profile: LearningProfile): string[] {
  const lines: string[] = [];
  const course = draft.courseFocus.trim() || profile.major;
  if (course) lines.push(`课程/方向：${course}`);
  if (draft.priority.trim()) lines.push(`优先突破：${draft.priority.trim()}`);
  if (draft.preference.trim()) lines.push(`资源偏好：${draft.preference.trim()}`);
  if (profile.goal) lines.push(`学习目标：${profile.goal}`);
  return lines;
}

export function bootstrapPathPlanFromInput(input: string, draft: PathPlanDraft): PathPlanDraft {
  const text = input.trim();
  const next = { ...draft };

  if (!next.courseFocus && /课程|专业|数据结构|算法|Python|人工智能|计算机|软件/.test(text)) {
    next.courseFocus = text.slice(0, 80);
  }
  if (!next.priority && /薄弱|优先|先学|重点|二叉|图|栈|队列|期末|考试/.test(text)) {
    next.priority = text.slice(0, 120);
  }
  if (!next.preference && /视频|文档|练习|导图|实操|偏好/.test(text)) {
    next.preference = text.slice(0, 80);
  }

  if (!next.priority && text.length > 4) {
    next.priority = next.priority || text.slice(0, 100);
  }

  return next;
}

/** 路径智能体本地多轮引导 */
export function buildPathAgentReply(
  userInput: string,
  draft: PathPlanDraft,
  profile: LearningProfile,
  userRound: number
): string {
  const next = bootstrapPathPlanFromInput(userInput, draft);
  const hasCourse = Boolean(next.courseFocus.trim() || profile.major);
  const hasPriority = Boolean(next.priority.trim() || profile.weakPoints.length);
  const hasPreference = Boolean(next.preference.trim() || profile.cognitiveStyle.length);

  const recap =
    summarizeDraft(next, profile).length > 0
      ? `\n\n已记录：\n${summarizeDraft(next, profile).map((l) => `- ${l}`).join("\n")}`
      : "";

  if (userRound <= 1) {
    return (
      "你好，我是 **路径规划智能体**。我会读取你的六维学习画像，规划分阶段学习路径并推送多模态资源。\n\n" +
      "请补充：\n1. **当前主攻课程**（若与画像专业不同可说明）\n2. **优先突破的知识点**\n3. **资源形式偏好**（文档 / 视频 / 题库等）" +
      recap
    );
  }

  if (!hasCourse) {
    return `请先告诉我你要规划哪门**课程或学习方向**，我会据此拆分阶段。${recap}`;
  }
  if (!hasPriority) {
    return `收到。还缺少 **优先突破的薄弱点或章节**，例如「二叉树遍历」「图的最短路」。${recap}`;
  }
  if (!hasPreference) {
    return `很好。最后补充一下 **资源偏好**（如更偏视频或题库），便于精准推送。${recap}`;
  }

  return (
    `规划信息已齐全，可以生成三阶段学习路径（含文档、导图、题库、视频、实操五类资源）。${recap}\n\n` +
    "如需调整请继续输入；否则点击 **「生成学习路径」**。"
  );
}

export async function sendPathPlanMessage(
  userInput: string,
  draft: PathPlanDraft,
  profile: LearningProfile,
  userRound: number,
  onToken: (chunk: string) => void
): Promise<PathPlanChatResult> {
  const useRemote = import.meta.env.VITE_PATH_PLAN_API !== "0";

  const finish = async (reply: string, usedFallback?: boolean): Promise<PathPlanChatResult> => {
    await simulateStream(reply, onToken, 14);
    return { reply, usedFallback };
  };

  if (useRemote) {
    try {
      // 持久化 session_id
      let sessionId = sessionStorage.getItem("path_plan_session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("path_plan_session_id", sessionId);
      }
      const json = await postAgentChat(
        API.agent.pathPlan,
        { user_input: userInput, session_id: sessionId },
        { withAuth: true, timeoutMs: 120_000 }
      );
      return finish(json.data!.ai_reply);
    } catch (err) {
      const msg = err instanceof AgentApiError ? err.message : "路径智能体请求失败";
      const local = buildPathAgentReply(userInput, draft, profile, userRound);
      return finish(`⚠️ ${msg}\n\n${local}`, true);
    }
  }

  return finish(buildPathAgentReply(userInput, draft, profile, userRound));
}

/** 完成路径规划：Agent finalize → learn-service 持久化 */
export async function finalizePathPlanRemote(sessionId: string) {
  const { postAgentRequest } = await import("./api/agent");
  return postAgentRequest<Record<string, unknown>>(
    API.agent.pathPlanFinalize,
    { session_id: sessionId },
    { withAuth: true, timeoutMs: 120_000 }
  );
}
