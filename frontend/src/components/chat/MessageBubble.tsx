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
import type { ChatMessage } from "../../types";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const [streamDone, setStreamDone] = useState(!message.streaming);
  const isUser = message.role === "user";
  const rootRef = useRef<HTMLDivElement>(null);

  useAnimeEntrance(rootRef, {
    y: isUser ? 10 : 12,
    x: isUser ? 10 : -8,
    duration: 420,
  });

  const copyText = () => navigator.clipboard.writeText(message.content);

  if (isUser) {
    return (
      <div ref={rootRef} className="doubao-msg doubao-msg--user">
        <div className="doubao-msg__user-bubble">{message.content}</div>
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
            <button type="button" title="重新生成（待后端）" disabled>
              <RotateCcw size={15} strokeWidth={1.75} />
            </button>
            <button type="button" title="有用">
              <ThumbsUp size={15} strokeWidth={1.75} />
            </button>
            <button type="button" title="没用">
              <ThumbsDown size={15} strokeWidth={1.75} />
            </button>
            <button type="button" title="收藏">
              <Star size={15} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
