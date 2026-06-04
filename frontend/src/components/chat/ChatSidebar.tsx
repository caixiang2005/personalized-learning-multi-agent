/**
 * @file ChatSidebar.tsx
 * @description 学习对话侧边栏：新对话 + 历史列表（豆包布局 · Scholar 视觉）。
 * @backend 历史 → 学习服务 · 多轮上下文 → agent Redis（暂时方案）
 */

import { useEffect, useState } from "react";
import {
  Search,
  SquarePen,
  MessageSquare,
  Map,
  ClipboardList,
  GitBranch,
  Loader2,
  Clock,
} from "lucide-react";
import type { ChatHistorySource } from "../../lib/api/chatHistory";
import { AGENT_CONTEXT_HINT, HISTORY_SERVICE_HINT } from "../../lib/chatSessions";
import type { StoredChatSession } from "../../lib/chatSessions";
import type { LearningProfile } from "../../types";

interface ChatSidebarProps {
  sessions: StoredChatSession[];
  activeSessionId: string;
  filter: string;
  profile: LearningProfile;
  loading: boolean;
  historyLoading: boolean;
  historySource: ChatHistorySource;
  onFilterChange: (value: string) => void;
  onSearch: (keyword: string) => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onQuickAction: (label: string) => void;
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  filter,
  profile,
  loading,
  historyLoading,
  historySource,
  onFilterChange,
  onSearch,
  onNewChat,
  onSelectSession,
  onQuickAction,
}: ChatSidebarProps) {
  const [localFilter, setLocalFilter] = useState(filter);

  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localFilter !== filter) onSearch(localFilter);
    }, 350);
    return () => clearTimeout(timer);
  }, [localFilter, filter, onSearch]);

  const filtered = sessions.filter(
    (s) =>
      !localFilter.trim() ||
      s.title.includes(localFilter.trim()) ||
      s.course.includes(localFilter.trim())
  );

  return (
    <>
      <div className="chat-sidebar__top shrink-0 p-3 pb-2">
        <button
          type="button"
          onClick={onNewChat}
          disabled={loading}
          className="chat-sidebar-new w-full cursor-pointer disabled:opacity-50"
        >
          <SquarePen size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
          <span>新对话</span>
        </button>
      </div>

      <div className="chat-sidebar__hint shrink-0 px-3 pb-2">
        <p className="chat-sidebar-hint">
          <Clock size={12} className="shrink-0" aria-hidden />
          <span>
            {AGENT_CONTEXT_HINT} · {HISTORY_SERVICE_HINT}
            {historySource !== "api" ? "（联调中）" : ""}
          </span>
        </p>
      </div>

      <div className="chat-sidebar__history shrink-0 px-3 pb-2">
        <p className="chat-sidebar__label">历史对话</p>
        <div className="relative mt-2">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--scholar-text-muted)] pointer-events-none"
            aria-hidden
          />
          <input
            value={localFilter}
            onChange={(e) => {
              setLocalFilter(e.target.value);
              onFilterChange(e.target.value);
            }}
            placeholder="搜索对话"
            className="chat-sidebar-search input-field pl-8 py-1.5 text-sm"
            aria-label="搜索历史对话"
          />
        </div>
      </div>

      <div className="chat-sidebar__list flex-1 min-h-0 overflow-y-auto px-2 pb-2">
        {historyLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--scholar-text-muted)]">
            <Loader2 size={16} className="animate-spin text-primary" aria-hidden />
            加载历史…
          </div>
        ) : filtered.length === 0 ? (
          <p className="chat-sidebar__empty px-2 py-6 text-center text-sm text-[var(--scholar-text-muted)]">
            {localFilter.trim()
              ? "没有匹配的对话"
              : historySource === "api"
                ? "暂无历史记录"
                : "发送消息后将出现在草稿列表，学习服务完善后自动同步"}
          </p>
        ) : (
          <ul className="space-y-0.5" role="list">
            {filtered.map((s) => {
              const active = s.sessionId === activeSessionId;
              return (
                <li key={s.sessionId}>
                  <button
                    type="button"
                    onClick={() => onSelectSession(s.sessionId)}
                    disabled={loading}
                    aria-current={active ? "true" : undefined}
                    className={`chat-history-item w-full cursor-pointer disabled:opacity-50 ${
                      active ? "chat-history-item--active" : ""
                    }`}
                  >
                    <MessageSquare
                      size={16}
                      strokeWidth={1.75}
                      className="shrink-0 chat-history-item__icon"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="chat-history-item__title block truncate">{s.title}</span>
                      <span className="chat-history-item__meta block truncate">
                        {s.draft ? "草稿 · " : ""}
                        {s.updatedAt}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="chat-sidebar__footer shrink-0 p-3 border-t border-gray-200/80 dark:border-gray-700/80 space-y-2">
        <p className="chat-sidebar__label">学习画像</p>
        <div className="chat-sidebar-profile">
          <p className="chat-sidebar-profile__major line-clamp-2">{profile.major}</p>
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-xs text-[var(--scholar-text-muted)]">健康度</span>
            <span className="text-sm font-semibold text-primary">{profile.healthScore}%</span>
          </div>
          <div className="progress-bar mt-2 h-1.5">
            <div className="progress-bar-fill" style={{ width: `${profile.healthScore}%` }} />
          </div>
        </div>
        <div className="grid gap-0.5 pt-1">
          {[
            { icon: Map, label: "生成学习路径" },
            { icon: ClipboardList, label: "生成练习题" },
            { icon: GitBranch, label: "生成思维导图" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => onQuickAction(item.label)}
              disabled={loading}
              className="chat-sidebar-quick flex items-center gap-2 px-2.5 py-2 text-xs rounded-lg cursor-pointer disabled:opacity-50"
            >
              <item.icon size={14} className="text-primary shrink-0" aria-hidden />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
