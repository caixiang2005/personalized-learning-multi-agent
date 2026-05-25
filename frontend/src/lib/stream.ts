/**
 * @file stream.ts
 * @description 前端本地模拟工具（不访问网络）。
 *
 * 【当前 Mock】
 *   - simulateStream：假装「流式」输出文字，用于 Home / Chat
 *   - checkSensitiveInput：本地关键词过滤
 *
 * 【待同步后端】
 *   - 流式输出 → lib/api/client.ts 的 streamChat()，对接 POST /api/chat/stream
 *   - 敏感词   → 可选 client.checkSensitiveApi()，对接 POST /api/safety/check
 */

/** 【当前 Mock】逐字输出，模拟 SSE 的 onChunk 效果 */
export async function simulateStream(
  text: string,
  onChunk: (partial: string) => void,
  delayMs = 28
): Promise<void> {
  let i = 0;
  while (i < text.length) {
    const step = Math.min(2 + Math.floor(Math.random() * 3), text.length - i);
    i += step;
    onChunk(text.slice(0, i));
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/** 【当前 Mock】本地违禁词，联调后可改为后端校验 */
export const BLOCKED_KEYWORDS = ["作弊", "代考", "答案泄露"];

/**
 * 【当前 Mock】返回错误文案或 null
 * 【待同步】可改为 await checkSensitiveApi(text)
 */
export function checkSensitiveInput(text: string): string | null {
  const hit = BLOCKED_KEYWORDS.find((k) => text.includes(k));
  return hit ? `输入包含敏感词「${hit}」，请修改后重试` : null;
}
