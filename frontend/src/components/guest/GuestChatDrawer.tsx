/**
 * @file GuestChatDrawer.tsx
 * @description 未登录访客：右侧滑出对话面板，对接 POST /api/agent/unlogin/chat。
 * @backend sendGuestMessage → agent-service :8003
 */

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Shield, LogIn, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentAvatar from "../chat/AgentAvatar";
import {
  sendGuestMessage,
  GUEST_MAX_FREE_ROUNDS,
  getGuestSessionId,
} from "../../lib/guestChat";
import { checkSensitiveInput } from "../../lib/stream";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const quickPrompts = [
  "你好，我想学习数据结构",
  "我是计算机专业大二",
  "多智能体能生成哪些资源？",
];

const WELCOME =
  "你好！👋 欢迎使用**个性化学习多智能体系统**。\n\n我是学习引导智能体，你可以先免费体验 **3 轮对话**。登录后可构建完整画像并生成多模态学习资源。\n\n**请问你是什么专业的？**";

export default function GuestChatDrawer({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [userRounds, setUserRounds] = useState(0);
  const [trialExhausted, setTrialExhausted] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, thinking]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking || trialExhausted) return;

    const blocked = checkSensitiveInput(content);
    if (blocked) {
      setMessages((m) => [
        ...m,
        { id: `u-${Date.now()}`, role: "user", content },
        { id: `a-${Date.now()}`, role: "assistant", content: `⚠️ ${blocked}` },
      ]);
      setInput("");
      return;
    }

    const nextRound = userRounds + 1;
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content };
    const assistantId = `a-${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setThinking(true);
    setUserRounds(nextRound);

    const result = await sendGuestMessage(content, (partial) => {
      setMessages((m) =>
        m.map((msg) => (msg.id === assistantId ? { ...msg, content: partial } : msg))
      );
    }, nextRound);

    setThinking(false);
    if (result.usedFallback) setUsedFallback(true);
    if (result.trialExhausted) setTrialExhausted(true);
  };

  const roundsLeft = Math.max(0, GUEST_MAX_FREE_ROUNDS - userRounds);

  return (
    <>
      <div
        className={`guest-drawer-backdrop ${open ? "guest-drawer-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`guest-drawer ${open ? "guest-drawer--open" : ""}`}
        role="dialog"
        aria-label="访客学习助手"
      >
        <header className="guest-drawer__head">
          <div className="flex items-center gap-3">
            <AgentAvatar thinking={thinking} />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">学习引导智能体</p>
              <p className="text-xs text-gray-500">
                未登录 · 免费体验 {userRounds}/{GUEST_MAX_FREE_ROUNDS} 轮
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary !p-2 rounded-lg" aria-label="关闭">
            <X size={18} />
          </button>
        </header>

        {usedFallback && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            未连接 agent-service，当前为本地 Mock。请启动后端 8003 端口后刷新。
          </div>
        )}

        {trialExhausted && (
          <div className="mx-4 mt-3 rounded-lg bg-primary/8 border border-primary/20 px-3 py-2 text-xs text-primary">
            免费体验已用完，登录后可继续使用完整功能。
          </div>
        )}

        <div className="guest-drawer__messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && <AgentAvatar thinking={thinking && !msg.content} />}
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="markdown-body text-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content || "…"}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {!trialExhausted && roundsLeft > 0 && (
          <div className="guest-drawer__quick">
            {quickPrompts.map((q) => (
              <button key={q} type="button" className="chip text-xs" onClick={() => send(q)} disabled={thinking}>
                {q}
              </button>
            ))}
          </div>
        )}

        <footer className="guest-drawer__foot">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <Shield size={12} />
              内容安全过滤
            </span>
            <span className="font-mono opacity-60" title="session_id">
              {getGuestSessionId().slice(0, 8)}…
            </span>
          </div>
          <div className="flex gap-2">
            <input
              className="input-field flex-1 text-sm"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !trialExhausted && send()}
              placeholder={
                trialExhausted ? "体验次数已用完，请登录" : `输入消息（剩余 ${roundsLeft} 轮）…`
              }
              disabled={trialExhausted || thinking}
            />
            <button
              type="button"
              className="btn-primary shrink-0 px-4"
              onClick={() => send()}
              disabled={thinking || trialExhausted}
            >
              {thinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          <Link
            to="/login"
            className={`btn-primary w-full mt-3 text-sm justify-center ${trialExhausted ? "ring-2 ring-primary ring-offset-2" : ""}`}
            onClick={onClose}
          >
            <LogIn size={16} />
            {trialExhausted ? "立即登录继续使用" : "登录解锁完整功能"}
          </Link>
        </footer>
      </aside>
    </>
  );
}
