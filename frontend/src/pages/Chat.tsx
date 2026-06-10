/**
 * @file Chat.tsx
 * @description 登录后学习对话（豆包式布局）· POST /api/agent/chat
 * @route /chat
 */

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
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
  Home,
  X,
} from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import UserAvatar from "../components/account/UserAvatar";
import { useAppStore } from "../store/useAppStore";
import { checkSensitiveInput } from "../lib/stream";
import { sendAgentMessage, resetAgentSessionId } from "../lib/agentChat";
import { sendProfileBuildMessage } from "../lib/profileBuildChat";
import {
  bootstrapProfileFromInput,
  finalizeProfileBuild,
  getResourceIntentPrompt,
} from "../lib/resourceIntents";
import { PROFILE_BUILD_PATH } from "../lib/navConfig";
import {
  needsProfileBuild as checkNeedsProfileBuild,
  type ProfileTutorGateLocationState,
} from "../lib/profileGate";
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

/** 旧版共用 messages 时，画像引导语会误出现在 /chat */
function isProfileAgentReply(content: string): boolean {
  return /学习画像智能体|生成六维画像|还缺少 \*\*学习目标\*\*|信息已基本齐全/.test(content);
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    profileBuildMessages,
    tutorMessages,
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
  const tutorMigrationRef = useRef(false);

  const isProfileAgentPage = location.pathname === PROFILE_BUILD_PATH;
  const gateState = location.state as ProfileTutorGateLocationState | null;
  const needsProfileBuild = checkNeedsProfileBuild(profileInitialized, profile);
  const isProfileBuild = isProfileAgentPage;
  const [gateBannerDismissed, setGateBannerDismissed] = useState(false);
  const [pathGateDismissed, setPathGateDismissed] = useState(false);
  const showTutorGateBanner =
    isProfileBuild && gateState?.fromTutorGate && !gateBannerDismissed;
  const showPathGateBanner =
    isProfileBuild && gateState?.fromPathGate && !pathGateDismissed;
  const chatChannel = isProfileBuild ? "profile" : "tutor";
  const messages = isProfileBuild ? profileBuildMessages : tutorMessages;
  const welcomeMsg = isProfileBuild ? profileWelcomeMsg : tutorWelcomeMsg;
  const quickCmds = isProfileBuild ? profileQuickCmds : tutorQuickCmds;
  const displayMessages = messages.length ? messages : [welcomeMsg];
  const showQuickCmds = messages.length === 0;
  const profileUserRounds = messages.filter((m) => m.role === "user").length;
  const canCompleteProfile = isProfileBuild && profileUserRounds >= 2 && !loading;

  const chatTitle = useMemo(() => {
    if (isProfileBuild) {
      return profileUserRounds > 0 ? "构建学习画像" : "画像智能体";
    }
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
    if (chatChannel === "tutor") resetAgentSessionId();
    setMessages([], chatChannel);
    setUsedFallback(false);
  };

  useEffect(() => {
    autoBootRef.current = false;
  }, [chatChannel]);

  useEffect(() => {
    setGateBannerDismissed(false);
  }, [gateState?.fromTutorGate]);

  useEffect(() => {
    setPathGateDismissed(false);
  }, [gateState?.fromPathGate]);

  /** 一次性：把误写入 tutor 的画像对话迁回 profile 通道 */
  useEffect(() => {
    if (isProfileBuild || tutorMigrationRef.current) return;
    tutorMigrationRef.current = true;
    const contaminated = tutorMessages.some(
      (m) => m.role === "assistant" && isProfileAgentReply(m.content)
    );
    if (!contaminated) return;
    if (profileBuildMessages.length === 0) {
      setMessages(tutorMessages, "profile");
    }
    setMessages([], "tutor");
  }, [isProfileBuild, tutorMessages, profileBuildMessages, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const sensitive = checkSensitiveInput(trimmed);
      if (sensitive) {
        addMessage(
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: sensitive,
            timestamp: Date.now(),
          },
          chatChannel
        );
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

      addMessage(
        {
          id: `u-${Date.now()}`,
          role: "user",
          content: trimmed,
          timestamp: Date.now(),
        },
        chatChannel
      );
      setInput("");
      setLoading(true);

      const assistantId = `a-${Date.now()}`;
      addMessage(
        {
          id: assistantId,
          role: "assistant",
          content: "",
          streaming: true,
          verified: true,
          timestamp: Date.now(),
        },
        chatChannel
      );

      const result = isProfileBuild
        ? await sendProfileBuildMessage(
            trimmed,
            (partial) => updateMessage(assistantId, { content: partial }, chatChannel),
            {
              major: profile.major,
              goal: profile.goal,
              level: profile.level,
            },
            profileUserRounds + 1
          )
        : await sendAgentMessage(trimmed, (partial) =>
            updateMessage(assistantId, { content: partial }, chatChannel)
          );

      updateMessage(assistantId, { streaming: false }, chatChannel);
      if (result.usedFallback && !isProfileBuild) setUsedFallback(true);
      setLoading(false);
    },
    [
      loading,
      isProfileBuild,
      chatChannel,
      profileUserRounds,
      profile.major,
      profile.goal,
      profile.level,
      profile.name,
      user?.username,
      addMessage,
      updateMessage,
      setProfile,
    ]
  );

  useEffect(() => {
    if (autoBootRef.current || loading || messages.some((m) => m.role === "user")) return;

    const stateMsg = (location.state as { initialMessage?: string } | null)?.initialMessage?.trim();
    const intentMsg = isProfileAgentPage ? null : getResourceIntentPrompt(searchParams.get("intent"));
    const text = stateMsg || intentMsg;
    if (!text) return;

    autoBootRef.current = true;
    navigate(location.pathname, { replace: true, state: {} });
    void sendMessage(text);
  }, [location.state, location.pathname, searchParams, loading, messages, navigate, sendMessage, isProfileAgentPage]);

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
        major: profile.major,
        goal: profile.goal,
        level: profile.level,
      },
      profileUserRounds
    );
    setProfile(finalized);
    setProfileInitialized(true);
    navigate("/profile");
  };

  const headerDisclaimer = isProfileBuild
    ? "画像智能体 · 对话抽取学习特征"
    : "内容由 AI 生成，请仔细甄别";

  const inputPlaceholder = isProfileBuild
    ? "描述专业、课程、目标、薄弱点…"
    : "发消息或输入学习问题…";

  if (!isProfileAgentPage && needsProfileBuild) {
    const intent = searchParams.get("intent") ?? undefined;
    return (
      <Navigate
        to={PROFILE_BUILD_PATH}
        replace
        state={{ ...gateState, fromTutorGate: true, intent }}
      />
    );
  }

  if (isProfileAgentPage && !needsProfileBuild) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="scholar-chat-page doubao-chat-shell relative flex h-[calc(100vh-56px)] pb-14 md:pb-0">
      <aside
        className={`doubao-sidebar ${
          sidebarCollapsed ? "doubao-sidebar--collapsed" : ""
        }`}
      >
        <nav className="doubao-sidebar__nav">
          {isProfileBuild ? (
            <Link to="/home" className="doubao-sidebar__nav-item no-underline">
              <Home size={18} strokeWidth={1.75} />
              <span>返回首页</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleNewChat}
              disabled={loading}
              className="doubao-sidebar__nav-item"
            >
              <SquarePen size={18} strokeWidth={1.75} />
              <span>新对话</span>
            </button>
          )}
        </nav>

        {!isProfileBuild && (
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
        )}

        {isProfileBuild && (
          <div className="doubao-sidebar__section">
            <p className="doubao-sidebar__section-title">当前智能体</p>
            <p className="doubao-sidebar__agent-label">画像智能体</p>
            <p className="doubao-sidebar__agent-desc">
              多轮对话抽取 ≥6 维学习特征，完成后进入学习驾驶舱
            </p>
          </div>
        )}

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
              onClick={isProfileBuild ? () => setMessages([], chatChannel) : handleNewChat}
              disabled={loading}
              className="doubao-chat-header__icon-btn"
              aria-label={isProfileBuild ? "重新开始画像对话" : "新对话"}
            >
              <SquarePen size={18} strokeWidth={1.75} />
            </button>
          </div>
          <div className="doubao-chat-header__center">
            <h1 className="doubao-chat-header__title">{chatTitle}</h1>
            <p className="doubao-chat-header__disclaimer">{headerDisclaimer}</p>
          </div>
          <div className="doubao-chat-header__right" aria-hidden />
        </header>

        {usedFallback && (
          <div className="doubao-chat-alert">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>未连接 agent-service（:8003），当前为本地 Mock。请启动后端后刷新。</span>
          </div>
        )}

        {showPathGateBanner && (
          <div className="chat-profile-banner chat-profile-banner--gate" role="status">
            <div className="chat-profile-banner__main">
              <AlertCircle size={16} className="text-[var(--scholar-accent-soft)] shrink-0" />
              <div>
                <p className="chat-profile-banner__title">规划学习路径前，请先完成学习画像</p>
                <p className="chat-profile-banner__desc">
                  路径智能体依赖六维画像进行阶段规划与资源推送。请在此完成至少 2 轮对话后生成画像。
                </p>
              </div>
            </div>
            <button
              type="button"
              className="chat-profile-banner__dismiss"
              aria-label="关闭提醒"
              onClick={() => setPathGateDismissed(true)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showTutorGateBanner && (
          <div className="chat-profile-banner chat-profile-banner--gate" role="status">
            <div className="chat-profile-banner__main">
              <AlertCircle size={16} className="text-[var(--scholar-accent-soft)] shrink-0" />
              <div>
                <p className="chat-profile-banner__title">使用智能辅导前，请先完成学习画像</p>
                <p className="chat-profile-banner__desc">
                  与画像智能体对话至少 2 轮，补充专业、目标与薄弱点后，点击「完成画像构建」即可进入智能辅导。
                </p>
              </div>
            </div>
            <button
              type="button"
              className="chat-profile-banner__dismiss"
              aria-label="关闭提醒"
              onClick={() => setGateBannerDismissed(true)}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {isProfileBuild && (
          <div className="chat-profile-banner chat-profile-banner--info">
            <div className="chat-profile-banner__main">
              <Sparkles size={16} className="text-[var(--scholar-primary)] shrink-0" />
              <div>
                <p className="chat-profile-banner__title">画像构建中（{profileUserRounds}/2 轮以上可完成）</p>
                <p className="chat-profile-banner__desc">
                  画像智能体为前端多轮引导（待后端 /api/agent/profile-build）。请补充专业、目标与薄弱点。
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
                placeholder={inputPlaceholder}
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
