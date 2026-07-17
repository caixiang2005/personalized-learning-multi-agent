/**
 * @file profileBuildChat.ts
 * @description 画像智能体对话 · POST /api/agent/profile-build（默认远程）
 *
 * 默认远程 agent；`VITE_PROFILE_BUILD_API=0` 时走本地多轮引导。
 * 不调用 /api/agent/chat（与知识库辅导会话隔离）。
 */

import { API } from "./api/endpoints";
import { postAgentChat } from "./api/agent";
import { bootstrapProfileFromInput } from "./resourceIntents";
import { simulateStream } from "./stream";

export interface ProfileDraft {
  major: string;
  goal: string;
  level: string;
}

export interface ProfileBuildChatResult {
  reply: string;
  usedFallback?: boolean;
  usedLocalAgent?: boolean;
}

/**
 * 调用后端 finalize 接口完成画像构建（remote 模式）
 * POST /api/agent/profile-build/finalize
 */
export async function finalizeProfileBuildRemote(
  sessionId: string
): Promise<{ code: number; msg: string; data?: any }> {
  try {
    const token = (await import("../lib/auth/token")).getToken();
    const res = await fetch(
      `${import.meta.env.VITE_API_BASE ?? "/api"}/agent/profile-build/finalize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_id: sessionId }),
      }
    );
    return await res.json();
  } catch (err) {
    return {
      code: 500,
      msg: err instanceof Error ? err.message : "网络异常",
    };
  }
}

/** 获取当前存储的 session_id（用于 finalize） */
export function getProfileBuildSessionId(): string {
  try {
    const stored = sessionStorage.getItem("profile_build_session_id");
    return stored || "";
  } catch {
    return "";
  }
}

export function setProfileBuildSessionId(id: string): void {
  try {
    sessionStorage.setItem("profile_build_session_id", id);
  } catch {
    // ignore
  }
}

function summarizeDraft(draft: ProfileDraft): string[] {
  const lines: string[] = [];
  if (draft.major?.trim()) lines.push(`专业/课程：${draft.major.trim()}`);
  if (draft.goal?.trim()) lines.push(`学习目标：${draft.goal.trim()}`);
  const levelLines = draft.level?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  if (levelLines.length) {
    lines.push(`学习背景：${levelLines[levelLines.length - 1]}`);
  }
  return lines;
}

/** 画像智能体本地多轮引导（不查知识库） */
export function buildProfileAgentReply(
  userInput: string,
  draft: ProfileDraft,
  userRound: number
): string {
  const next = bootstrapProfileFromInput(userInput, draft);
  const hasMajor = Boolean(next.major?.trim());
  const hasGoal = Boolean(next.goal?.trim());
  const levelLines = next.level?.split("\n").map((l) => l.trim()).filter(Boolean) ?? [];
  const hasWeakHint = levelLines.some((l) =>
    /薄弱|不熟|不会|困难|偏好|视频|练习|入门|复习|一半|基础/.test(l)
  );

  if (userRound === 1) {
    if (hasMajor && hasGoal) {
      return (
        `收到。${next.major}，目标 **${next.goal}**。\n\n` +
        "请再补充 **当前水平与薄弱点**（例如哪些章节还不熟、更偏好视频还是刷题）。"
      );
    }
    if (hasMajor) {
      return (
        `了解了，**${next.major}**。\n\n` +
        "请告诉我你的 **学习目标**（如期末分数、考证或想掌握的范围）。"
      );
    }
    return (
      "你好，我是 **学习画像智能体**，会通过对话帮你抽取学习特征。\n\n" +
      "请先说明 **专业 / 正在学的课程**，以及你的 **学习目标**。"
    );
  }

  if (!hasGoal) {
    return "还缺少 **学习目标**。例如：期末 85 分、通过某门考试、或掌握某几个章节。";
  }

  if (!hasMajor) {
    return "请补充 **专业或课程方向**，便于生成更贴合的路径与资源。";
  }

  if (!hasWeakHint && userRound < 3) {
    return (
      `目标 **${next.goal}** 已记录。\n\n` +
      "请具体说说 **薄弱知识点** 或 **学习偏好**（如二叉树、图算法、偏好视频讲解）。"
    );
  }

  const summary = summarizeDraft(next);
  const recap = summary.length ? `\n\n当前已记录：\n${summary.map((s) => `- ${s}`).join("\n")}` : "";

  if (userRound >= 2) {
    return (
      `信息已基本齐全，可以生成六维画像了。${recap}\n\n` +
      "如需补充请继续输入；否则点击上方 **「完成画像构建」**。"
    );
  }

  return `收到，我会继续完善你的画像。${recap}`;
}

export async function sendProfileBuildMessage(
  userInput: string,
  onChunk: (partial: string) => void,
  draft: ProfileDraft,
  userRound: number
): Promise<ProfileBuildChatResult> {
  const useRemote = import.meta.env.VITE_PROFILE_BUILD_API !== "0"; // 默认启用后端

  const finish = async (
    reply: string,
    opts?: { usedFallback?: boolean; usedLocalAgent?: boolean }
  ): Promise<ProfileBuildChatResult> => {
    await simulateStream(reply, onChunk, 14);
    return { reply, ...opts };
  };

  if (useRemote) {
    try {
      // 保持同一会话使用同一个 session_id
      let sessionId = getProfileBuildSessionId();
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        setProfileBuildSessionId(sessionId);
      }
      const json = await postAgentChat(
        API.agent.profileBuild,
        { user_input: userInput, session_id: sessionId },
        { withAuth: true, timeoutMs: 120_000 }
      );
      return finish(json.data!.ai_reply);
    } catch (err) {
      const reason =
        err instanceof Error && err.message
          ? err.message
          : "网络或服务异常";
      const local = buildProfileAgentReply(userInput, draft, userRound);
      const tip =
        reason.includes("登录") || reason.includes("401")
          ? "登录已失效，请重新登录后再用画像智能体。"
          : `后端画像智能体暂不可用（${reason}），使用本地引导。`;
      return finish(`⚠️ ${tip}\n\n${local}`, {
        usedFallback: true,
        usedLocalAgent: true,
      });
    }
  }

  return finish(buildProfileAgentReply(userInput, draft, userRound), {
    usedLocalAgent: true,
  });
}
