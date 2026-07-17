/**
 * @file GuestChatDrawer.tsx
 * @description 未登录访客对话（豆包式布局）· POST /api/agent/unlogin/chat
 */

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, LogIn, AlertCircle, Paperclip } from "lucide-react";
import { Link } from "react-router-dom";
import MarkdownContent from "../ui/MarkdownContent";
import AgentAvatar from "../chat/AgentAvatar";
import { sendGuestMessage } from "../../lib/guestChat";
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
  "你好！👋 欢迎使用**个性化学习多智能体系统**。\n\n我是学习引导智能体，可以先和你聊聊学习背景与目标。登录后可构建完整画像并生成多模态学习资源。\n\n**请问你是什么专业的？**";

function createMessageId(role: "user" | "assistant"): string {
  const prefix = role === "user" ? "u" : "a";
  return `${prefix}-${crypto.randomUUID()}`;
}

export default function GuestChatDrawer({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [userRounds, setUserRounds] = useState(0);
  const [trialExhausted, setTrialExhausted] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const hasUserMessage = messages.some((m) => m.role === "user");
  const showQuickPrompts = !trialExhausted && !hasUserMessage;

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, thinking]);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || thinking || trialExhausted) return;

    const blocked = await checkSensitiveInput(content);
    if (blocked) {
      setMessages((m) => [
        ...m,
        { id: createMessageId("user"), role: "user", content },
        { id: createMessageId("assistant"), role: "assistant", content: `⚠️ ${blocked}` },
      ]);
      setInput("");
      return;
    }

    const nextRound = userRounds + 1;
    const userMsg: Message = { id: createMessageId("user"), role: "user", content };
    const assistantId = createMessageId("assistant");
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !trialExhausted) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <div
        className={`guest-drawer-backdrop ${open ? "guest-drawer-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`guest-drawer doubao-chat-main ${open ? "guest-drawer--open" : ""}`}
        role="dialog"
        aria-label="访客学习助手"
      >
        <header className="guest-drawer__head">
          <div className="flex items-center gap-3">
            <AgentAvatar size="sm" thinking={thinking} />
            <div>
              <p className="guest-drawer__title">学习引导智能体</p>
              <p className="guest-drawer__subtitle">访客体验 · 最多 3 轮</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary p-2! rounded-lg" aria-label="关闭">
            <X size={18} />
          </button>
        </header>

        {usedFallback && (
          <div className="guest-drawer__alert guest-drawer__alert--warn">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            智能助手暂时不可用，已切换为本地引导。请稍后重试。
          </div>
        )}

        {trialExhausted && (
          <div className="guest-drawer__alert guest-drawer__alert--info">
            当前体验次数已用完，登录后可继续使用完整功能。
          </div>
        )}

        <div ref={messagesRef} className="doubao-chat-thread flex-1 min-h-0">
          {messages.map((msg) =>
            msg.role === "user" ? (
              <div key={msg.id} className="doubao-msg doubao-msg--user">
                <div className="doubao-msg__user-bubble">{msg.content}</div>
              </div>
            ) : (
              <div key={msg.id} className="doubao-msg doubao-msg--assistant">
                <AgentAvatar size="sm" thinking={thinking && !msg.content && msg.id !== "welcome"} />
                <div className="doubao-msg__body">
                  <div className="doubao-msg__content">
                    <MarkdownContent content={msg.content || "…"} />
                  </div>
                </div>
              </div>
            )
          )}
          {thinking && (
            <div className="doubao-thinking">
              <Loader2 size={14} className="animate-spin text-primary" />
              正在思考…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <footer className="guest-drawer__foot">
          {showQuickPrompts && (
            <div className="doubao-composer__suggestions mb-3">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="doubao-suggest-chip"
                  onClick={() => send(q)}
                  disabled={thinking}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="doubao-composer__box">
            <textarea
              className="doubao-composer__input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={trialExhausted ? "请登录后继续使用" : "发消息或输入学习问题…"}
              rows={1}
              disabled={trialExhausted || thinking}
            />
            <div className="doubao-composer__toolbar">
              <div className="doubao-composer__tools">
                <button type="button" className="doubao-composer__tool" disabled title="附件（登录后可用）">
                  <Paperclip size={18} strokeWidth={1.75} />
                </button>
              </div>
              <button
                type="button"
                className="doubao-composer__send"
                onClick={() => send()}
                disabled={thinking || trialExhausted || !input.trim()}
                aria-label="发送"
              >
                {thinking ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} strokeWidth={2} />}
              </button>
            </div>
          </div>

          <p className="doubao-composer__footnote">内容由 AI 生成，请仔细甄别</p>

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
