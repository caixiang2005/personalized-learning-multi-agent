import type { ChatAttachment } from "../types";

/** 组装发送给后端的文本（含附件 OCR 上下文） */
export function buildOutboundChatText(text: string, attachment?: ChatAttachment | null): string {
  const trimmed = text.trim();
  if (!attachment) return trimmed;

  const lines: string[] = [];
  if (trimmed) lines.push(trimmed);

  if (attachment.mimeType.startsWith("image/")) {
    lines.push(`[图片附件：${attachment.fileName}]`);
  } else {
    lines.push(`[附件：${attachment.fileName}]`);
  }

  if (attachment.ocrText?.trim()) {
    lines.push(`识别到的文字：\n${attachment.ocrText.trim()}`);
  }

  return lines.join("\n\n");
}

/** 用户气泡展示的纯文本（不含 OCR 块） */
export function buildUserBubbleText(text: string, attachment?: ChatAttachment | null): string {
  const trimmed = text.trim();
  if (!attachment) return trimmed;
  if (trimmed) return trimmed;
  return attachment.mimeType.startsWith("image/") ? "（图片）" : `（附件：${attachment.fileName}）`;
}
