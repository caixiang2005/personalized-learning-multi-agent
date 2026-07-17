/**
 * 头像 URL：接口返回相对路径时拼静态服务地址。
 * Docker/Nginx 同源部署时不要写死 :8001（宿主机通常未映射该端口）。
 * - 未设置 VITE_STATIC_ORIGIN → 用相对路径（走当前域名 /static）
 * - 开发直连 user-service 时可设 VITE_STATIC_ORIGIN=http://127.0.0.1:8001
 */
const STATIC_ORIGIN = (import.meta.env.VITE_STATIC_ORIGIN ?? "").replace(/\/$/, "");

export function avatarFullUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("blob:")) return avatarUrl;
  const path = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return STATIC_ORIGIN ? `${STATIC_ORIGIN}${path}` : path;
}

/** 相对 /static 路径在浏览器同源（Vite 代理或 Nginx）下直接可用 */
export function avatarDisplayUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("blob:")) return avatarUrl;
  if (avatarUrl.startsWith("/static/")) {
    return STATIC_ORIGIN ? `${STATIC_ORIGIN}${avatarUrl}` : avatarUrl;
  }
  return avatarFullUrl(avatarUrl);
}

export const AVATAR_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  const okTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!okTypes.includes(file.type)) {
    return "仅支持 JPG、PNG、WEBP、GIF 图片";
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return "头像大小不能超过 2MB";
  }
  return null;
}
