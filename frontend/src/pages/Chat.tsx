/**
 * @file Chat.tsx
 * @description 登录后学习对话：对接 agent-service POST /api/agent/chat。
 * @route /chat
 * @backend agent-service :8003 · { user_input, session_id } → { ai_reply: Markdown }
 */

import { useRef, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Map,
  ClipboardList,
  GitBranch,
  Paperclip,
  Send,
  PanelLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  Shield,
} from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import PageHeader from "../components/ui/PageHeader";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import { useAppStore } from "../store/useAppStore";
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
  const {
    messages,
    addMessage,
    updateMessage,
    sessions,
    profile,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [activeSession, setActiveSession] = useState("1");
  const [usedFallback, setUsedFallback] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages.length ? messages : [welcomeMsg];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  const sendMessage = async (text: string) => {
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
  };

  return (
    <div className="scholar-chat-page relative flex h-[calc(100vh-56px)] md:h-[calc(100vh-56px)] pb-14 md:pb-0">
      <aside
        className={`${
          sidebarCollapsed ? "w-0 overflow-hidden border-0" : "w-72 lg:w-80"
        } shrink-0 border-r border-gray-200/80 dark:border-gray-700/80 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex flex-col transition-all duration-300 absolute lg:relative z-20 h-full shadow-xl lg:shadow-none`}
      >
        <div className="p-4 border-b border-gray-200/80 dark:border-gray-700/80">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            对话历史
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="按课程 / 知识点搜索"
              className="input-field pl-9 py-2"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {sessions
            .filter((s) => !filter || s.course.includes(filter) || s.title.includes(filter))
            .map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSession(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer ${
                  activeSession === s.id
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <p className="font-medium truncate">{s.title}</p>
                <p className="text-xs opacity-70 mt-0.5">
                  {s.course} · {s.updatedAt}
                </p>
              </button>
            ))}
        </div>

        <div className="p-4 border-t border-gray-200/80 dark:border-gray-700/80 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">学习画像</p>
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/10">
            <p className="font-medium text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
              {profile.major}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">健康度</span>
              <span className="text-sm font-semibold text-primary">{profile.healthScore}%</span>
            </div>
            <div className="progress-bar mt-2 h-1.5">
              <div className="progress-bar-fill" style={{ width: `${profile.healthScore}%` }} />
            </div>
          </div>
          <div className="grid gap-1">
            {[
              { icon: Map, label: "生成学习路径" },
              { icon: ClipboardList, label: "生成练习题" },
              { icon: GitBranch, label: "生成思维导图" },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => sendMessage(item.label)}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-primary/8 text-gray-600 dark:text-gray-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                <item.icon size={14} className="text-primary" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {!sidebarCollapsed && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-10" onClick={toggleSidebar} aria-hidden />
      )}

      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="hidden lg:block px-4 pt-4 max-w-3xl mx-auto w-full">
          <PageHeader
            title="学习对话"
            subtitle="知识库增强 · Markdown 回复 · 同页 session 记忆"
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
            <div className="flex items-center justify-between text-[10px] text-[var(--scholar-text-muted)] mb-2">
              <span className="flex items-center gap-1">
                <Shield size={11} />
                内容安全过滤
              </span>
              <span className="flex items-center gap-1 font-mono opacity-70" title="session_id">
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
