/**
 * @file stream.ts
 * @description 流式 UX 工具：SSE 解析、本地打字模拟、敏感词过滤。
 */

import { API } from "./api/endpoints";

/** 解析 fetch SSE 响应体，逐条 yield JSON 事件 */
export async function* readSseJsonEvents(
  response: Response
): AsyncGenerator<Record<string, unknown>, void, unknown> {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;
        try {
          yield JSON.parse(trimmed.slice(6)) as Record<string, unknown>;
        } catch {
          // skip unparseable lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** 逐字输出，模拟 SSE 的 onChunk 效果（非流式 API 回退时使用） */
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

/** 本地违禁词（API 不可用时的 fallback） */
export const BLOCKED_KEYWORDS = ["作弊", "代考", "答案泄露", "枪手", "替考"];

function checkSensitiveInputLocal(text: string): string | null {
  const hit = BLOCKED_KEYWORDS.find((k) => text.includes(k));
  return hit ? `输入包含敏感词「${hit}」，请修改后重试` : null;
}

/** 优先 POST /api/safety/check，失败时回退本地词表 */
export async function checkSensitiveInput(text: string): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    const res = await fetch(API.safety.check, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });
    const json = await res.json();
    if (json.code === 200 && json.data?.safe === false) {
      return (
        (json.data.message as string) ||
        `输入包含敏感词「${json.data.hit}」，请修改后重试`
      );
    }
    if (json.code === 200 && json.data?.safe === true) {
      return null;
    }
  } catch {
    /* 后端未就绪 → 本地 fallback */
  }

  return checkSensitiveInputLocal(trimmed);
}
