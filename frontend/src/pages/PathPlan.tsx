/**
 * @file PathPlan.tsx
 * @description 路径规划智能体：结合画像规划阶段路径与多模态资源推送
 * @route /path/plan
 *
 * ✅ 已对接 POST /api/agent/path-plan · POST /api/learning-path/generate
 * （VITE_PATH_PLAN_API=0 或 API 失败时走 generateLearningPath.ts 本地 fallback）
 */

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Send,
  PanelLeft,
  Loader2,
  SquarePen,
  Sparkles,
  ArrowRight,
  Home,
  ChevronRight,
  Paperclip,
} from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import UserAvatar from "../components/account/UserAvatar";
import { useAppStore } from "../store/useAppStore";
import { checkSensitiveInput } from "../lib/stream";
import {
  bootstrapPathPlanFromInput,
  sendPathPlanMessage,
  finalizePathPlanRemote,
  type PathPlanDraft,
} from "../lib/pathPlanChat";
import { generateLearningPath } from "../lib/generateLearningPath";
import { generateLearningPathApi } from "../lib/api/learn";
import { AgentApiError } from "../lib/api/agent";
import { parseLearningPathApiData } from "../lib/pathSync";
import { needsProfileBuild as checkNeedsProfileBuild } from "../lib/profileGate";
import { PROFILE_BUILD_PATH } from "../lib/navConfig";
import { PATH_HUB_PATH, PATH_VIEW_PATH } from "../lib/pathRoutes";
import type { ChatMessage } from "../types";

const welcomeMsg: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好！我是**路径规划智能体**。\n\n我会读取你的六维学习画像，规划 **3 个学习阶段**，并为每个知识点推送 **文档、导图、题库、视频、实操** 五类资源。\n\n请告诉我：当前主攻课程、优先突破的薄弱点，以及资源形式偏好。",
  verified: true,
  timestamp: Date.now(),
};

export default function PathPlan() {
  const navigate = useNavigate();
  const {
    profile,
    profileInitialized,
    pathPlanMessages,
    addPathPlanMessage,
    updatePathPlanMessage,
    setPathPlanMessages,
    setLearningPath,
    user,
    userAvatarUrl,
    avatarCacheVersion,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore();

  const needsProfile = checkNeedsProfileBuild(profileInitialized, profile);
  const draftRef = useRef<PathPlanDraft>({
    courseFocus: profile.major || "",
    priority: "",
    preference: profile.cognitiveStyle[0] || "",
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPath, setGeneratingPath] = useState(false);
  const [pathError, setPathError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = pathPlanMessages.length ? pathPlanMessages : [welcomeMsg];
  const userRounds = pathPlanMessages.filter((m) => m.role === "user").length;
  const canGenerate = userRounds >= 2 && !loading;
  const showQuickCmds = pathPlanMessages.length === 0;

  const quickCmds = useMemo(() => {
    const cmds = [
      profile.major ? `主攻课程：${profile.major}` : "主攻数据结构课程",
      profile.weakPoints[0]
        ? `优先突破：${profile.weakPoints[0].name}`
        : "优先突破二叉树与图算法",
      /视频/.test(profile.level + profile.cognitiveStyle.join())
        ? "资源偏好：视频 + 练习题"
        : "资源偏好：文档 + 题库",
    ];
    return cmds;
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  const displayName = profile.name || user?.username || "用户";
  const username = user?.username ?? "用户";
  const userId = user?.userId ?? 1;

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const sensitive = await checkSensitiveInput(trimmed);
      if (sensitive) {
        addPathPlanMessage({
          id: `err-${Date.now()}`,
          role: "assistant",
          content: sensitive,
          timestamp: Date.now(),
        });
        return;
      }

      draftRef.current = bootstrapPathPlanFromInput(trimmed, draftRef.current);

      addPathPlanMessage({
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      });
      setInput("");
      setLoading(true);

      const assistantId = `a-${Date.now()}`;
      addPathPlanMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        verified: true,
        timestamp: Date.now(),
      });

      await sendPathPlanMessage(
        trimmed,
        draftRef.current,
        profile,
        userRounds + 1,
        (partial) => updatePathPlanMessage(assistantId, { content: partial })
      );

      updatePathPlanMessage(assistantId, { streaming: false });
      setLoading(false);
    },
    [loading, profile, userRounds, addPathPlanMessage, updatePathPlanMessage]
  );

  const persistPath = useCallback(
    async (stages: ReturnType<typeof generateLearningPath>["stages"], meta: ReturnType<typeof generateLearningPath>["meta"]) => {
      try {
        const res = await generateLearningPathApi({
          course: meta.course,
          goal: draftRef.current.priority.trim() || profile.goal || "阶段学习目标",
          stages,
          title: meta.title,
        });
        if (res.code === 200 && res.data) {
          const parsed = parseLearningPathApiData(res.data as Record<string, unknown>);
          if (parsed) {
            setLearningPath(parsed.stages, parsed.meta);
            return true;
          }
        }
      } catch {
        // fallback to local store only
      }
      setLearningPath(stages, meta);
      return false;
    },
    [profile.goal, setLearningPath]
  );

  const handleGeneratePath = async () => {
    if (!canGenerate || generatingPath) return;
    setPathError(null);
    setGeneratingPath(true);

    try {
      const useRemote = import.meta.env.VITE_PATH_PLAN_API !== "0";
      const sid = sessionStorage.getItem("path_plan_session_id");

      if (useRemote && sid) {
        try {
          const res = await finalizePathPlanRemote(sid);
          if (res.data) {
            const parsed = parseLearningPathApiData(res.data);
            if (parsed) {
              setLearningPath(parsed.stages, parsed.meta);
              navigate(PATH_VIEW_PATH);
              return;
            }
          }
        } catch (err) {
          if (err instanceof AgentApiError && err.code === 400) {
            setPathError(err.message || "请先完成路径对话，待智能体输出完整路径后再生成");
          }
          // other errors: fallback below
        }
      }

      const { stages, meta } = generateLearningPath(profile, draftRef.current, userRounds);
      await persistPath(stages, meta);
      navigate(PATH_VIEW_PATH);
    } finally {
      setGeneratingPath(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  if (needsProfile) {
    return <Navigate to={PROFILE_BUILD_PATH} replace state={{ fromPathGate: true }} />;
  }

  return (
    <div className="scholar-chat-page doubao-chat-shell relative flex h-[calc(100vh-56px)] pb-14 md:pb-0">
      <aside className={`doubao-sidebar ${sidebarCollapsed ? "doubao-sidebar--collapsed" : ""}`}>
        <nav className="doubao-sidebar__nav">
          <Link to={PATH_HUB_PATH} className="doubao-sidebar__nav-item no-underline">
            <Home size={18} strokeWidth={1.75} />
            <span>路径中心</span>
          </Link>
          <button
            type="button"
            onClick={() => !loading && setPathPlanMessages([])}
            disabled={loading}
            className="doubao-sidebar__nav-item"
          >
            <SquarePen size={18} strokeWidth={1.75} />
            <span>重新规划</span>
          </button>
        </nav>

        <div className="doubao-sidebar__section">
          <p className="doubao-sidebar__section-title">当前智能体</p>
          <p className="doubao-sidebar__agent-label">路径智能体</p>
          <p className="doubao-sidebar__agent-desc">规划阶段 · 推送资源</p>
        </div>

        <Link to="/account" className="doubao-sidebar__user">
          <UserAvatar
            userId={userId}
            displayName={displayName}
            username={username}
            avatarUrl={userAvatarUrl}
            avatarVersion={avatarCacheVersion}
            size="md"
            className="doubao-sidebar__user-avatar"
          />
          <span className="doubao-sidebar__user-name">{displayName}</span>
          <ChevronRight size={16} className="doubao-sidebar__user-chevron" />
        </Link>
      </aside>

      {!sidebarCollapsed && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-10" onClick={toggleSidebar} aria-hidden />
      )}

      <button
        type="button"
        className="doubao-sidebar-toggle md:hidden"
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? "展开侧栏" : "收起侧栏"}
      >
        <PanelLeft size={18} />
      </button>

      <div className="flex-1 flex flex-col min-w-0 relative doubao-chat-main">
        <header className="doubao-chat-header">
          <div className="doubao-chat-header__left">
            <button
              type="button"
              onClick={toggleSidebar}
              className="doubao-chat-header__icon-btn"
              aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              <PanelLeft size={18} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => !loading && setPathPlanMessages([])}
              disabled={loading}
              className="doubao-chat-header__icon-btn"
              aria-label="重新规划"
            >
              <SquarePen size={18} strokeWidth={1.75} />
            </button>
          </div>
          <div className="doubao-chat-header__center">
            <h1 className="doubao-chat-header__title">路径规划</h1>
            <p className="doubao-chat-header__disclaimer">路径智能体 · 画像驱动 · 动态资源推送</p>
          </div>
          <div className="doubao-chat-header__right" aria-hidden />
        </header>

        <div className="chat-profile-banner chat-profile-banner--info">
          <div className="chat-profile-banner__main">
            <Sparkles size={16} className="text-[var(--scholar-primary)] shrink-0" />
            <div>
              <p className="chat-profile-banner__title">路径规划中（{userRounds}/2 轮以上可生成）</p>
              <p className="chat-profile-banner__desc">
                补充课程、薄弱点与资源偏好后，点击「生成学习路径」查看三阶段规划与多模态资源。
              </p>
              {pathError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{pathError}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="chat-profile-banner__btn"
            disabled={!canGenerate || generatingPath}
            onClick={() => void handleGeneratePath()}
          >
            {generatingPath ? "生成中…" : "生成学习路径"}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="doubao-chat-thread">
          <div className="doubao-chat-thread__inner">
            {displayMessages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && (
              <div className="doubao-thinking">
                <Loader2 size={14} className="animate-spin text-primary" />
                路径智能体规划中…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="doubao-composer">
          <div className="doubao-composer__inner">
            {showQuickCmds && (
              <div className="doubao-composer__suggestions">
                {quickCmds.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => void sendMessage(cmd)}
                    disabled={loading}
                    className="doubao-suggest-chip"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            )}
            <div className="doubao-composer__box">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="说明课程、薄弱点、资源偏好…"
                className="doubao-composer__input"
                rows={1}
                disabled={loading}
              />
              <div className="doubao-composer__toolbar">
                <div className="doubao-composer__tools">
                  <button
                    type="button"
                    className="doubao-composer__tool"
                    title="上传文件"
                  >
                    <Paperclip size={18} strokeWidth={1.75} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="doubao-composer__send"
                  aria-label="发送"
                >
                  {loading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Send size={17} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
