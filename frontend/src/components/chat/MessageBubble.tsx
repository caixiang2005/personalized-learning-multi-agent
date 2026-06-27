/**
 * @file MessageBubble.tsx
 * @description 单条聊天消息（豆包式：用户右气泡、助手左栏扁平正文 + 操作条）
 * @backend POST /api/chat/feedback（有用/没用/收藏）
 */
import { useState, useRef } from "react";
import { Copy, ThumbsDown, ThumbsUp, Star, RotateCcw } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import MarkdownContent from "../ui/MarkdownContent";
import MultimodalCard from "./MultimodalCard";
import StreamText from "../ui/StreamText";
import { useAnimeEntrance } from "../../hooks/useAnimeEntrance";
import { submitChatFeedback } from "../../lib/api/learn";
import type { ChatMessage } from "../../types";

export type FeedbackType = "useful" | "useless" | "favorite";

interface Props {
  message: ChatMessage;
  sessionId?: string | null;
  feedbackEnabled?: boolean;
  regenerateEnabled?: boolean;
  onRegenerate?: (messageId: string) => void;
}

export default function MessageBubble({
  message,
  sessionId,
  feedbackEnabled = false,
  regenerateEnabled = false,
  onRegenerate,
}: Props) {
  const [streamDone, setStreamDone] = useState(!message.streaming);
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const isUser = message.role === "user";
  const rootRef = useRef<HTMLDivElement>(null);

  useAnimeEntrance(rootRef, {
    y: isUser ? 10 : 12,
    x: isUser ? 10 : -8,
    duration: 420,
  });

  const copyText = () => navigator.clipboard.writeText(message.content);

  const handleFeedback = async (type: FeedbackType) => {
    if (!feedbackEnabled || feedbackBusy) return;
    setFeedbackBusy(true);
    try {
      const res = await submitChatFeedback({
        messageId: message.id,
        type,
        sessionId: sessionId ?? undefined,
      });
      if (res?.code === 200) {
        setFeedback(res.data?.type ?? null);
      }
    } catch {
      /* 静默失败，不影响对话 */
    } finally {
      setFeedbackBusy(false);
    }
  };

  if (isUser) {
    return (
      <div ref={rootRef} className="doubao-msg doubao-msg--user">
        <div className="doubao-msg__user-bubble">
          {message.attachments?.map((att) =>
            att.mimeType.startsWith("image/") && att.previewUrl ? (
              <img
                key={att.id}
                src={att.previewUrl}
                alt={att.fileName}
                className="max-w-full max-h-48 rounded-lg mb-2 object-contain"
              />
            ) : (
              <p key={att.id} className="text-xs opacity-80 mb-1">
                📎 {att.fileName}
              </p>
            )
          )}
          {message.content ? <span>{message.content}</span> : null}
        </div>
      </div>
    );
  }

  const showActions = streamDone && !message.streaming && message.content;

  return (
    <div ref={rootRef} className="doubao-msg doubao-msg--assistant">
      <AgentAvatar
        size="sm"
        thinking={message.streaming && !streamDone}
        done={streamDone && !message.streaming}
      />
      <div className="doubao-msg__body">
        <div className="doubao-msg__content">
          {message.streaming && !streamDone ? (
            <p className="text-[15px] leading-relaxed text-[var(--scholar-text-secondary)]">
              <StreamText text={message.content} onDone={() => setStreamDone(true)} />
            </p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
          {message.resources?.map((r) => (
            <MultimodalCard key={r.id} resource={r} />
          ))}
        </div>
        {showActions && (
          <div className="doubao-msg__actions" role="toolbar" aria-label="消息操作">
            <button type="button" onClick={copyText} title="复制">
              <Copy size={15} strokeWidth={1.75} />
            </button>
            <button
              type="button"
              title="重新生成"
              disabled={!regenerateEnabled}
              onClick={() => onRegenerate?.(message.id)}
            >
              <RotateCcw size={15} strokeWidth={1.75} />
            </button>
            {feedbackEnabled && (
              <>
                <button
                  type="button"
                  title="有用"
                  aria-pressed={feedback === "useful"}
                  className={feedback === "useful" ? "doubao-msg__action--active" : undefined}
                  disabled={feedbackBusy}
                  onClick={() => handleFeedback("useful")}
                >
                  <ThumbsUp size={15} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  title="没用"
                  aria-pressed={feedback === "useless"}
                  className={feedback === "useless" ? "doubao-msg__action--active" : undefined}
                  disabled={feedbackBusy}
                  onClick={() => handleFeedback("useless")}
                >
                  <ThumbsDown size={15} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  title="收藏"
                  aria-pressed={feedback === "favorite"}
                  className={feedback === "favorite" ? "doubao-msg__action--active" : undefined}
                  disabled={feedbackBusy}
                  onClick={() => handleFeedback("favorite")}
                >
                  <Star size={15} strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
