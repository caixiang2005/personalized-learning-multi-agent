/**
 * @file bilibiliMeta.ts
 * @description B 站封面拉取与播放量/时长格式化
 */

const coverCache = new Map<string, string>();

/** 开发环境走 Vite 代理，避免 CORS；生产环境尝试直连 */
export async function fetchBilibiliCover(bvid: string): Promise<string | null> {
  if (coverCache.has(bvid)) return coverCache.get(bvid)!;

  const urls = [
    `/bili-api/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
    `https://api.bilibili.com/x/web-interface/view?bvid=${encodeURIComponent(bvid)}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const json = (await res.json()) as { data?: { pic?: string } };
      const pic = json?.data?.pic;
      if (pic) {
        coverCache.set(bvid, pic);
        return pic;
      }
    } catch {
      /* try next */
    }
  }

  return null;
}

export function parsePlayCountNumber(text?: string): number | null {
  if (!text) return null;
  const t = text.replace(/,/g, "").trim();
  const wan = t.match(/^([\d.]+)\s*万/);
  if (wan?.[1]) return parseFloat(wan[1]) * 10000;
  const num = t.match(/^([\d.]+)/);
  return num?.[1] ? parseFloat(num[1]) : null;
}

export function formatPlayCount(text?: string): string {
  if (!text?.trim()) return "—";
  const n = parsePlayCountNumber(text);
  if (n == null) return text.trim();
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  return String(Math.round(n));
}

export function formatDuration(text?: string): string {
  if (!text?.trim()) return "";
  const t = text.trim();

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return t;

  const minMatch = t.match(/([\d.]+)\s*分钟/);
  if (minMatch?.[1]) {
    const totalMin = Math.round(parseFloat(minMatch[1]));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h >= 100) {
      const sec = 0;
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:00`;
    return `${m}:00`;
  }

  const secMatch = t.match(/([\d.]+)\s*小时/);
  if (secMatch?.[1]) {
    const h = Math.floor(parseFloat(secMatch[1]));
    return `${h}:00:00`;
  }

  return t;
}

export function isHotVideo(playCountText?: string): boolean {
  const n = parsePlayCountNumber(playCountText);
  return n != null && n >= 500_000;
}
