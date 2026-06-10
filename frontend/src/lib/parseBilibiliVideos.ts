/**
 * @file parseBilibiliVideos.ts
 * @description 从 Agent Markdown 回复中解析 B 站视频链接及 UP主/播放量等元数据
 */

export interface BilibiliVideoMeta {
  title: string;
  url: string;
  bvid: string;
  uploader?: string;
  playCountText?: string;
  durationText?: string;
  tag?: string;
}

export type MarkdownSegment =
  | { type: "markdown"; content: string }
  | { type: "video"; video: BilibiliVideoMeta };

const BILIBILI_LINK_RE =
  /\[([^\]]+)\]\((https?:\/\/(?:www\.)?bilibili\.com\/video\/(BV[\w]+)[^)]*)\)/gi;

function parseMetaAfterLink(content: string, afterLink: number): Partial<BilibiliVideoMeta> {
  let pos = afterLink;
  while (pos < content.length && /\s/.test(content[pos]!)) pos += 1;

  const meta: Partial<BilibiliVideoMeta> = {};
  let lineStart = pos;

  for (let n = 0; n < 4; n += 1) {
    const lineEnd = content.indexOf("\n", lineStart);
    const line = (lineEnd === -1 ? content.slice(lineStart) : content.slice(lineStart, lineEnd)).trim();
    if (!line) break;

    const bullet = line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "");

    if (/^UP主[：:]/i.test(bullet)) {
      meta.uploader = bullet.replace(/^UP主[：:]\s*/i, "").trim();
      lineStart = lineEnd === -1 ? content.length : lineEnd + 1;
      continue;
    }

    if (/^播放量[：:]/i.test(bullet)) {
      const raw = bullet.replace(/^播放量[：:]\s*/i, "").trim();
      const paren = raw.match(/[（(]([^）)]+)[）)]/);
      if (paren?.[1]) {
        const inner = paren[1];
        const dur = inner.match(/时长\s*([^，,]+)/);
        if (dur?.[1]) meta.durationText = dur[1].trim();
        const tagPart = inner.replace(/时长\s*[^，,]+[，,]?\s*/, "").trim();
        if (tagPart) meta.tag = tagPart;
      }
      meta.playCountText = raw.replace(/[（(][^）)]*[）)]/g, "").trim();
      lineStart = lineEnd === -1 ? content.length : lineEnd + 1;
      continue;
    }

    break;
  }

  return meta;
}

function findBlockEnd(content: string, afterLink: number): number {
  let pos = afterLink;
  while (pos < content.length && content[pos] === "\n") pos += 1;

  let lineStart = pos;
  while (lineStart < content.length) {
    const lineEnd = content.indexOf("\n", lineStart);
    const line = (lineEnd === -1 ? content.slice(lineStart) : content.slice(lineStart, lineEnd)).trim();
    if (!line) break;

    const bullet = line.replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
    if (/^UP主[：:]/i.test(bullet) || /^播放量[：:]/i.test(bullet)) {
      lineStart = lineEnd === -1 ? content.length : lineEnd + 1;
      continue;
    }
    break;
  }

  return lineStart;
}

/** 将 Markdown 拆成普通文本段 + 视频卡片段 */
export function splitMarkdownWithVideos(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  const blocks: { meta: BilibiliVideoMeta; start: number; end: number }[] = [];

  for (const match of content.matchAll(BILIBILI_LINK_RE)) {
    const full = match[0];
    const title = match[1]?.trim() ?? "B站视频";
    const url = match[2] ?? "";
    const bvid = match[3] ?? "";
    const start = match.index ?? 0;
    const extra = parseMetaAfterLink(content, start + full.length);

    blocks.push({
      meta: {
        title,
        url,
        bvid,
        uploader: extra.uploader,
        playCountText: extra.playCountText,
        durationText: extra.durationText,
        tag: extra.tag,
      },
      start,
      end: findBlockEnd(content, start + full.length),
    });
  }

  if (!blocks.length) return [{ type: "markdown", content }];

  let lastIndex = 0;
  for (const block of blocks) {
    if (block.start > lastIndex) {
      segments.push({ type: "markdown", content: content.slice(lastIndex, block.start) });
    }
    segments.push({ type: "video", video: block.meta });
    lastIndex = block.end;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "markdown", content: content.slice(lastIndex) });
  }

  return segments;
}

/** 连续视频卡片合并为网格 */
export function groupVideoSegments(
  segments: MarkdownSegment[]
): Array<MarkdownSegment | { type: "video-grid"; videos: BilibiliVideoMeta[] }> {
  const grouped: Array<MarkdownSegment | { type: "video-grid"; videos: BilibiliVideoMeta[] }> = [];
  let i = 0;

  while (i < segments.length) {
    const seg = segments[i]!;
    if (seg.type !== "video") {
      grouped.push(seg);
      i += 1;
      continue;
    }

    const videos: BilibiliVideoMeta[] = [seg.video];
    i += 1;
    while (i < segments.length && segments[i]!.type === "video") {
      videos.push((segments[i] as Extract<MarkdownSegment, { type: "video" }>).video);
      i += 1;
    }
    grouped.push({ type: "video-grid", videos });
  }

  return grouped;
}
