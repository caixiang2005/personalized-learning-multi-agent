import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import MarkdownContent from "../ui/MarkdownContent";
import { sendAgentMessage, setAgentSessionId } from "../../lib/agentChat";

type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean };

type Props = { embedded?: boolean };

const PLAN_SESSION_KEY = "plan-chat-session-id";

function getPlanSessionId(): string {
  const cached = sessionStorage.getItem(PLAN_SESSION_KEY);
  if (cached) {
    setAgentSessionId(cached);
    return cached;
  }
  const id = `plan-${crypto.randomUUID()}`;
  sessionStorage.setItem(PLAN_SESSION_KEY, id);
  setAgentSessionId(id);
  return id;
}

const PLAN_SEED =
  "你好，我是今日学习助手。你可以问我今日计划里的知识点、薄弱点，或让我帮你拆解一道题。";

export default function PlanChatPanel({ embedded = false }: Props) {
  const sessionRef = useRef(getPlanSessionId());
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: PLAN_SEED },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    const assistantIdx = messages.length + 1;
    setMessages((m) => [...m, { role: "assistant", content: "", streaming: true }]);

    try {
      await sendAgentMessage(
        text,
        (partial) => {
          setMessages((m) => {
            const next = [...m];
            next[assistantIdx] = { role: "assistant", content: partial, streaming: true };
            return next;
          });
        },
        sessionRef.current,
      );
      setMessages((m) => {
        const next = [...m];
        const last = next[assistantIdx];
        if (last) next[assistantIdx] = { ...last, streaming: false };
        return next;
      });
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[assistantIdx] = {
          role: "assistant",
          content: "暂时无法连接辅导服务，请稍后再试。",
          streaming: false,
        };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`scholar-card flex flex-col overflow-hidden ${embedded ? "min-h-[280px]" : "min-h-[280px]"}`}>
      {!embedded && (
        <div className="px-4 py-3 border-b border-[var(--scholar-border)]">
          <h3 className="text-sm font-semibold text-[var(--scholar-text)]">对话式学习</h3>
          <p className="text-xs text-[var(--scholar-text-muted)] mt-0.5">流式答疑 · 今日知识点</p>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${embedded ? "max-h-[360px]" : "max-h-64"}`}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm rounded-[10px] px-3 py-2 max-w-[90%] ${
              m.role === "user"
                ? "ml-auto bg-[var(--scholar-primary)] text-white"
                : "bg-[color-mix(in_srgb,var(--scholar-primary)_6%,var(--scholar-card))] text-[var(--scholar-text-secondary)] border border-[var(--scholar-border)]"
            }`}
          >
            {m.streaming && !m.content ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <div className="markdown-body text-sm">
                <MarkdownContent content={m.content} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[var(--scholar-border)] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="向今日助手提问…"
          className="input-field flex-1 text-sm"
          aria-label="学习计划对话输入"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="btn-primary px-4 shrink-0 cursor-pointer"
          aria-label="发送"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
