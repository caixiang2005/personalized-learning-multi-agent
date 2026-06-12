import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PLAN_CHAT_REPLY, PLAN_CHAT_SEED } from "../../lib/mockDailyPlan";
import { simulateStream } from "../../lib/stream";

type Msg = { role: "user" | "assistant"; content: string; streaming?: boolean };

type Props = { embedded?: boolean };

export default function PlanChatPanel({ embedded = false }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: PLAN_CHAT_SEED },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    const id = messages.length + 1;
    setMessages((m) => [...m, { role: "assistant", content: "", streaming: true }]);

    await simulateStream(PLAN_CHAT_REPLY, (partial) => {
      setMessages((m) => {
        const next = [...m];
        next[id] = { role: "assistant", content: partial, streaming: true };
        return next;
      });
    }, 20);

    setMessages((m) => {
      const next = [...m];
      next[id] = { role: "assistant", content: PLAN_CHAT_REPLY, streaming: false };
      return next;
    });
    setLoading(false);
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
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
