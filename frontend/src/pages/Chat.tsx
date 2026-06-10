/**
 * @file Chat.tsx
 * @description 登录后学习对话（豆包式布局）· POST /api/agent/chat
 * @route /chat
 */

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronRight,
  Paperclip,
  Send,
  PanelLeft,
  Loader2,
  AlertCircle,
  SquarePen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import UserAvatar from "../components/account/UserAvatar";
import { useAppStore } from "../store/useAppStore";
import { checkSensitiveInput } from "../lib/stream";
import { sendAgentMessage, resetAgentSessionId } from "../lib/agentChat";
import {
  bootstrapProfileFromInput,
  finalizeProfileBuild,
  getResourceIntentPrompt,
} from "../lib/resourceIntents";
import type { ChatMessage } from "../types";

const tutorQuickCmds = [
  "Python 列表推导式怎么用？",
  "有没有学习 Python 的视频链接？",
  "栈和队列有什么区别？",
];

const profileQuickCmds = [
  "我是软件工程专业，正在学数据结构",
  "目标是期末考 85 分以上",
  "薄弱点：二叉树和图算法，偏好视频学习",
];

const profileWelcomeMsg: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好！我是**学习画像智能体**。\n\n请用自然语言告诉我：\n1. 你的**专业 / 课程**\n2. **学习目标**\n3. **当前水平与薄弱点**\n\n可以多轮补充，完成后点击「完成画像构建」生成六维画像。",
  verified: true,
  timestamp: Date.now(),
};

const tutorWelcomeMsg: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是**知识库学习助手**。\n\n我可以结合教程知识库与视频资源回答学习问题。直接输入问题，或点下方推荐试试。",
  verified: true,
  timestamp: Date.now(),
};

function truncateTitle(text: string, max = 20): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    messages,
    addMessage,
    updateMessage,
    setMessages,
    setProfile,
    setProfileInitialized,
    profileInitialized,
    sessions,
    profile,
    user,
    userAvatarUrl,
    avatarCacheVersion,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState("1");
  const [usedFallback, setUsedFallback] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoBootRef = useRef(false);

  const isProfileBuild = !profileInitialized;
  const welcomeMsg = isProfileBuild ? profileWelcomeMsg : tutorWelcomeMsg;
  const quickCmds = isProfileBuild ? profileQuickCmds : tutorQuickCmds;
  const displayMessages = messages.length ? messages : [welcomeMsg];
  const showQuickCmds = messages.length === 0;
  const profileUserRounds = messages.filter((m) => m.role === "user").length;
  const canCompleteProfile = isProfileBuild && profileUserRounds >= 2 && !loading;

  const chatTitle = useMemo(() => {
    if (isProfileBuild) return profileUserRounds > 0 ? "构建学习画像" : "学习画像引导";
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser?.content) return truncateTitle(firstUser.content);
    const active = sessions.find((s) => s.id === activeSession);
    if (active?.title) return truncateTitle(active.title);
    return "新对话";
  }, [messages, sessions, activeSession, isProfileBuild, profileUserRounds]);

  const displayName = profile.name || user?.username || "用户";
  const username = user?.username ?? "用户";
  const userId = user?.userId ?? 1;

  const handleNewChat = () => {
    if (loading) return;
    resetAgentSessionId();
    setMessages([]);
    setUsedFallback(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const sensitive = checkSensitiveInput(trimmed);
      if (sensitive) {
        addMessage({
          id: `err-${Date.now()}`,
          role: "assistant",
          content: sensitive,
          timestamp: Date.now(),
        });
        return;
      }

      if (isProfileBuild) {
        const draft = bootstrapProfileFromInput(trimmed, {
          major: profile.major,
          goal: profile.goal,
          level: profile.level,
        });
        setProfile({
          ...draft,
          name: profile.name || user?.username || "学习者",
        });
      }

      addMessage({
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      });
      setInput("");
      setLoading(true);

      const assistantId = `a-${Date.now()}`;
      addMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        verified: true,
        timestamp: Date.now(),
      });

      const result = await sendAgentMessage(trimmed, (partial) =>
        updateMessage(assistantId, { content: partial })
      );

      updateMessage(assistantId, { streaming: false });
      if (result.usedFallback) setUsedFallback(true);
      setLoading(false);
    },
    [
      loading,
      messages,
      isProfileBuild,
      profile.major,
      profile.goal,
      profile.level,
      profile.name,
      user?.username,
      addMessage,
      updateMessage,
      setProfile,
      setProfileInitialized,
    ]
  );

  useEffect(() => {
    if (autoBootRef.current || loading || messages.some((m) => m.role === "user")) return;

    const stateMsg = (location.state as { initialMessage?: string } | null)?.initialMessage?.trim();
    const intentMsg = getResourceIntentPrompt(searchParams.get("intent"));
    const text = stateMsg || intentMsg;
    if (!text) return;

    autoBootRef.current = true;
    navigate("/chat", { replace: true, state: {} });
    void sendMessage(text);
  }, [location.state, searchParams, loading, messages, navigate, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleCompleteProfile = () => {
    if (!canCompleteProfile) return;
    const finalized = finalizeProfileBuild(
      {
        name: profile.name || user?.username || "学习者",
        major: profile.major || "未指定专业",
        goal: profile.goal || "提升学习能力",
        level: profile.level || "待补充",
      },
      profileUserRounds
    );
    setProfile(finalized);
    setProfileInitialized(true);
    navigate("/profile");
  };

  return (
    <div className="scholar-chat-page doubao-chat-shell relative flex h-[calc(100vh-56px)] pb-14 md:pb-0">
      <aside
        className={`doubao-sidebar ${
          sidebarCollapsed ? "doubao-sidebar--collapsed" : ""
        }`}
      >
        <nav className="doubao-sidebar__nav">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={loading}
            className="doubao-sidebar__nav-item"
          >
            <SquarePen size={18} strokeWidth={1.75} />
            <span>新对话</span>
          </button>
        </nav>

        <div className="doubao-sidebar__section">
          <p className="doubao-sidebar__section-title">历史对话</p>
          <div className="doubao-sidebar__history">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSession(s.id)}
                className={`doubao-sidebar__history-item ${
                  activeSession === s.id ? "doubao-sidebar__history-item--active" : ""
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
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
              onClick={handleNewChat}
              disabled={loading}
              className="doubao-chat-header__icon-btn"
              aria-label="新对话"
            >
              <SquarePen size={18} strokeWidth={1.75} />
            </button>
          </div>
          <div className="doubao-chat-header__center">
            <h1 className="doubao-chat-header__title">{chatTitle}</h1>
            <p className="doubao-chat-header__disclaimer">内容由 AI 生成，请仔细甄别</p>
          </div>
          <div className="doubao-chat-header__right" aria-hidden />
        </header>

        {usedFallback && (
          <div className="doubao-chat-alert">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>未连接 agent-service（:8003），当前为本地 Mock。请启动后端后刷新。</span>
          </div>
        )}

        {isProfileBuild && (
          <div className="chat-profile-banner">
            <div className="chat-profile-banner__main">
              <Sparkles size={16} className="text-[var(--scholar-primary)] shrink-0" />
              <div>
                <p className="chat-profile-banner__title">画像构建中（{profileUserRounds}/2 轮以上可完成）</p>
                <p className="chat-profile-banner__desc">
                  请补充专业、目标与薄弱点；完成后生成六维画像，再进入学习中心
                </p>
              </div>
            </div>
            <button
              type="button"
              className="chat-profile-banner__btn"
              disabled={!canCompleteProfile}
              onClick={handleCompleteProfile}
            >
              完成画像构建
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="doubao-chat-thread">
          <div className="doubao-chat-thread__inner">
            {displayMessages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {loading && (
              <div className="doubao-thinking">
                <Loader2 size={14} className="animate-spin text-primary" />
                正在思考…
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
                    onClick={() => sendMessage(cmd)}
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
                placeholder="发消息或输入学习问题…"
                className="doubao-composer__input"
                rows={1}
                disabled={loading}
              />
              <div className="doubao-composer__toolbar">
                <div className="doubao-composer__tools">
                  <button
                    type="button"
                    className="doubao-composer__tool"
                    title="附件（待后端）"
                    disabled
                  >
                    <Paperclip size={18} strokeWidth={1.75} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => sendMessage(input)}
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
