/**
 * @file MessageBubble.tsx
 * @description 单条聊天消息气泡（用户/助手）、Markdown、资源卡片、反馈按钮。
 * @backend POST /api/chat/feedback（有用/没用/收藏）
 */
import { useState } from "react";
import { Copy, ThumbsDown, ThumbsUp, Star, MessageCirclePlus, ShieldCheck } from "lucide-react";
import AgentAvatar from "./AgentAvatar";
import MarkdownContent from "../ui/MarkdownContent";
import MultimodalCard from "./MultimodalCard";
import StreamText from "../ui/StreamText";
import type { ChatMessage } from "../../types";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const [streamDone, setStreamDone] = useState(!message.streaming);
  const isUser = message.role === "user";

  const copyText = () => navigator.clipboard.writeText(message.content);

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in mb-5">
        <div className="max-w-[82%] px-4 py-3 rounded-2xl rounded-tr-md bg-primary text-white text-sm shadow-md leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-6 animate-fade-in">
      <AgentAvatar thinking={message.streaming && !streamDone} done={streamDone && !message.streaming} />
      <div className="flex-1 min-w-0">
        <div className="px-4 py-3.5 rounded-2xl rounded-tl-md bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/80 shadow-sm">
          {message.streaming && !streamDone ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <StreamText text={message.content} onDone={() => setStreamDone(true)} />
            </p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
          {message.verified && (
            <p className="mt-3 text-xs text-accent flex items-center gap-1 font-medium">
              <ShieldCheck size={13} /> 内容已校验
            </p>
          )}
          {message.resources?.map((r) => (
            <MultimodalCard key={r.id} resource={r} />
          ))}
        </div>
        {streamDone && (
          <div className="flex flex-wrap items-center gap-3 mt-2.5 pl-1">
            {[
              { icon: Copy, label: "复制", onClick: copyText },
              { icon: ThumbsUp, label: "有用" },
              { icon: ThumbsDown, label: "没用" },
              { icon: MessageCirclePlus, label: "补充提问" },
              { icon: Star, label: "收藏" },
            ].map(({ icon: Icon, label, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className="text-xs flex items-center gap-1 text-gray-400 hover:text-primary transition-colors"
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
