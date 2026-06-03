/**
 * @file Chat.tsx
 * @description 学习对话主界面：会话列表、消息、资源卡片、快捷指令。
 * @route /chat
 *
 * 【当前 Mock】
 *   - 会话列表：store.sessions（来自 mockData）
 *   - 发消息：simulateStream + 本地 updateMessage，资源卡片写死在代码里
 *   - 切换会话：仅改 activeSession，不拉历史消息
 *
 * 【待同步后端】
 *   - 挂载：fetchChatSessions → setSessions
 *   - 切换会话：fetchMessages(sessionId) → setMessages
 *   - 发送：streamChat({ content, sessionId }) 替代 simulateStream
 *   - 附件：POST /api/chat/upload
 *   - 反馈：sendMessageFeedback → MessageBubble 按钮
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
} from "lucide-react";
import MessageBubble from "../components/chat/MessageBubble";
import { MessageSkeleton } from "../components/ui/Skeleton";
import PageHeader from "../components/ui/PageHeader";
import StreamProgress from "../components/scholar/StreamProgress";
import ResourceTypeStrip from "../components/scholar/ResourceTypeStrip";
import { useAppStore } from "../store/useAppStore";
import { simulateStream, checkSensitiveInput } from "../lib/stream";
import type { ChatMessage } from "../types";

const quickCmds = ["按我的画像生成", "针对易错点出题", "生成实操案例"];

const welcomeMsg: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好！这里是**学习对话**，可协助构建画像、生成学习路径、答疑与资源推荐。\n\n试试：「我想复习栈和队列，请生成学习资料」",
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
  const [genProgress, setGenProgress] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const displayMessages = messages.length ? messages : [welcomeMsg];

  // 消息列表滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, loading]);

  // 【待同步后端】useEffect → fetchChatSessions() 写入 store.sessions
  // 【待同步后端】activeSession 变化 → fetchMessages(sessionId) → setMessages

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    // 【待同步后端】可选 checkSensitiveApi(trimmed) 替代 checkSensitiveInput
    const sensitive = checkSensitiveInput(trimmed);
    if (sensitive) {
      addMessage({ id: `err-${Date.now()}`, role: "assistant", content: sensitive, timestamp: Date.now() });
      return;
    }

    addMessage({ id: `u-${Date.now()}`, role: "user", content: trimmed, timestamp: Date.now() });
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

    setGenProgress(0);
    const progressTimer = setInterval(() => {
      setGenProgress((p) => (p !== null && p < 95 ? p + 5 : p));
    }, 200);

    // 【待同步后端】删除 simulateStream，改用 streamChat({ content: trimmed, sessionId: activeSession }, ...)
    const response = `好的，已根据你的学习画像（${profile.major}）为你准备内容。\n\n### 学习建议\n1. 先回顾 **栈与队列** 的基本操作\n2. 针对 **二叉树遍历** 做专项练习\n3. 图算法建议从 BFS/DFS 对比入手\n\n> 参考资料：教材第 3-5 章、课程讲义`;

    await simulateStream(response, (partial) => updateMessage(assistantId, { content: partial }), 20);

    clearInterval(progressTimer);
    setGenProgress(100);

    updateMessage(assistantId, {
      streaming: false,
      resources: [
        {
          id: "gen-1",
          type: "mindmap",
          title: "栈与队列知识导图",
          description: "系统生成 · 可缩放导出",
          progress: 100,
          mermaid: "graph LR\n栈-->LIFO\n队列-->FIFO",
        },
        {
          id: "gen-2",
          type: "exercise",
          title: "易错点专项 8 题",
          description: "提交后自动批改",
          progress: 100,
        },
      ],
    });
    setGenProgress(null);
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
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">对话历史</p>
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
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeSession === s.id
                    ? "bg-primary/10 border border-primary/20 text-primary"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                <p className="font-medium truncate">{s.title}</p>
                <p className="text-xs opacity-70 mt-0.5">{s.course} · {s.updatedAt}</p>
              </button>
            ))}
        </div>

        <div className="p-4 border-t border-gray-200/80 dark:border-gray-700/80 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">学习画像</p>
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/10">
            <p className="font-medium text-sm text-gray-800 dark:text-gray-200 line-clamp-2">{profile.major}</p>
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
                className="flex items-center gap-2 px-3 py-2 text-xs rounded-xl hover:bg-primary/8 text-gray-600 dark:text-gray-400 transition-colors"
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
          <PageHeader title="学习对话" subtitle="流式输出 · 卡片式多模态资源 · 智能辅导" badge="核心功能" />
          <div className="mb-4">
            <ResourceTypeStrip />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden absolute left-3 top-3 z-10 p-2 rounded-xl glass-panel"
        >
          <PanelLeft size={18} />
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 glass-panel rounded-full shadow-md"
          style={{ left: sidebarCollapsed ? 4 : undefined }}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex-1 overflow-y-auto px-4 py-4 lg:py-2 max-w-3xl mx-auto w-full">
          {displayMessages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {loading && <MessageSkeleton />}
          {genProgress !== null && (
            <div className="scholar-card mb-4 p-4">
              <StreamProgress progress={genProgress} label="多智能体协同生成资源" />
              <p className="text-xs text-[var(--scholar-text-muted)] mt-2">
                导图 → 题库 → 文档 · 当前 {genProgress}%
              </p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200/80 dark:border-gray-700/80 p-4 glass-panel">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              {quickCmds.map((cmd) => (
                <button key={cmd} type="button" onClick={() => sendMessage(cmd)} className="chip">
                  {cmd}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary p-3 shrink-0" title="上传附件">
                <Paperclip size={18} />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="输入学习需求，如：我想复习栈和队列..."
                className="input-field flex-1"
              />
              <button type="button" onClick={() => sendMessage(input)} disabled={loading} className="btn-primary px-5 shrink-0">
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
