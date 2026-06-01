/**
 * 头像 URL：接口返回相对路径时拼静态服务地址
 */
const STATIC_ORIGIN =
  import.meta.env.VITE_STATIC_ORIGIN?.replace(/\/$/, "") ?? "http://127.0.0.1:8001";

export function avatarFullUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("blob:")) return avatarUrl;
  const path = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;
  return `${STATIC_ORIGIN}${path}`;
}

/** 开发环境可走 Vite 代理 */
export function avatarDisplayUrl(avatarUrl: string | null | undefined): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http") || avatarUrl.startsWith("blob:")) return avatarUrl;
  if (import.meta.env.DEV && avatarUrl.startsWith("/static/")) {
    return avatarUrl;
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
