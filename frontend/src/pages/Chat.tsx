/**
 * @file Chat.tsx
 * @description 登录后学习对话。
 * @route /chat
 * @backend
 *   - 发消息：agent-service POST /api/agent/chat（Redis 多轮上下文，当前暂存约 2h，非最终方案）
 *   - 历史列表/消息：学习服务 GET /api/chat/sessions（队长规划，待完善）
 */

import { useRef, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Send,
  PanelLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import ChatSidebar from "../components/chat/ChatSidebar";
import PageHeader from "../components/ui/PageHeader";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import { useAppStore } from "../store/useAppStore";
import { useChatSessionManager } from "../hooks/useChatSessionManager";
import { checkSensitiveInput } from "../lib/stream";
import { sendAgentMessage, getAgentSessionId } from "../lib/agentChat";
import type { ChatMessage } from "../types";

const quickCmds = [
  "Python 列表推导式怎么用？",
  "栈和队列有什么区别？",
  "帮我梳理二叉树遍历",
];

const welcomeMsg: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是**知识库学习助手**。\n\n我会结合课程知识库回答你的问题，回复为 **Markdown** 格式。\n\n试试：「Python 列表推导式怎么用？」",
  verified: true,
  timestamp: Date.now(),
};

export default function Chat() {
  const { profile, sidebarCollapsed, toggleSidebar } = useAppStore();
  const course = profile.major || "学习对话";

  const {
    sessions,
    activeSessionId,
    messages,
    setMessages,
    historySource,
    historyLoading,
    messagesLoading,
    sessionTick,
    handleNewChat,
    handleSelectSession,
    handleSearch,
    persistCurrentDraft,
  } = useChatSessionManager({ course });

  const [input, setInput] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages.length ? messages : [welcomeMsg];
  const showQuickCmds = messages.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading, messagesLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const sensitive = checkSensitiveInput(trimmed);
    if (sensitive) {
      const next: ChatMessage[] = [
        ...messages,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: sensitive,
          timestamp: Date.now(),
        },
      ];
      setMessages(next);
      persistCurrentDraft(next);
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    const nextAfterUser = [...messages, userMsg];
    setMessages(nextAfterUser);
    setInput("");
    setLoading(true);

    const assistantId = `a-${Date.now()}`;
    const withAssistant: ChatMessage[] = [
      ...nextAfterUser,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        streaming: true,
        verified: true,
        timestamp: Date.now(),
      },
    ];
    setMessages(withAssistant);

    const result = await sendAgentMessage(trimmed, (partial) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: partial } : m))
      );
    });

    const finalMessages = withAssistant.map((m) =>
      m.id === assistantId ? { ...m, streaming: false, content: result.reply || m.content } : m
    );
    setMessages(finalMessages);
    persistCurrentDraft(finalMessages);
    if (result.usedFallback) setUsedFallback(true);
    setLoading(false);
  };

  return (
    <div className="scholar-chat-page relative flex h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] pb-14 md:pb-0">
      <aside
        className={`${
          sidebarCollapsed ? "w-0 overflow-hidden border-0" : "w-72 lg:w-80"
        } shrink-0 border-r border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex flex-col transition-all duration-300 absolute lg:relative z-20 h-full shadow-xl lg:shadow-none`}
      >
        {!sidebarCollapsed && (
          <ChatSidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            filter={filter}
            profile={profile}
            loading={loading}
            historyLoading={historyLoading}
            historySource={historySource}
            onFilterChange={setFilter}
            onSearch={handleSearch}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            onQuickAction={sendMessage}
          />
        )}
      </aside>

      {!sidebarCollapsed && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-10" onClick={toggleSidebar} aria-hidden />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="hidden lg:block px-4 pt-4 max-w-3xl mx-auto w-full">
          <PageHeader
            title="学习对话"
            subtitle="历史由学习服务加载 · 多轮上下文当前暂用 Redis（暂时方案）"
            badge="Agent"
          />
          <div className="mb-4">
            <ResourceTypeStrip />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden absolute left-3 top-3 z-10 p-2 rounded-xl glass-panel cursor-pointer"
          aria-label="展开侧边栏"
        >
          <PanelLeft size={18} />
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 glass-panel rounded-full shadow-md cursor-pointer"
          style={{ left: sidebarCollapsed ? 4 : undefined }}
          aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {usedFallback && (
          <div className="mx-4 mt-3 lg:mt-0 max-w-3xl lg:mx-auto w-full flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 px-3 py-2.5 text-xs text-amber-900 dark:text-amber-100">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>未连接 agent-service（:8003），当前为本地 Mock。请启动后端后刷新页面。</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:py-2 max-w-3xl mx-auto w-full">
          {messagesLoading && (
            <div className="flex items-center gap-2 text-xs text-[var(--scholar-text-muted)] mb-4">
              <Loader2 size={14} className="animate-spin text-primary" />
              正在加载会话消息…
            </div>
          )}
          {displayMessages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-[var(--scholar-text-muted)] mb-4 pl-12">
              <Loader2 size={14} className="animate-spin text-primary" />
              正在生成回复…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200/80 dark:border-gray-700/80 p-4 glass-panel">
          <div className="max-w-3xl mx-auto">
            {showQuickCmds && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickCmds.map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => sendMessage(cmd)}
                    disabled={loading}
                    className="chip cursor-pointer disabled:opacity-50"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-[10px] text-[var(--scholar-text-muted)] mb-2">
              <span className="flex items-center gap-1">
                <Shield size={11} />
                内容安全过滤
              </span>
              <span
                key={sessionTick}
                className="flex items-center gap-1 font-mono opacity-70"
                title="session_id（与 agent Redis 上下文对应）"
              >
                <Sparkles size={11} className="text-primary" />
                {getAgentSessionId().slice(0, 8)}…
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary p-3 shrink-0 opacity-60 cursor-not-allowed"
                title="附件上传待后端接口"
                disabled
              >
                <Paperclip size={18} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="输入学习问题，如：Python 列表推导式怎么用？"
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="btn-primary px-5 shrink-0 cursor-pointer disabled:opacity-50"
                aria-label="发送"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
