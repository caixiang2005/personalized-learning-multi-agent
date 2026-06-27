/**
 * @file profileReady.ts
 * @description 判断用户是否已通过对话完成画像构建（区分旧 mock / 未构建）
 */
import type { LearningProfile } from "../types";

const BUILD_SOURCE = "对话画像构建";

export function isProfileReady(profile: LearningProfile | null | undefined): boolean {
  const dims = profile?.learnerDimensions;
  if (!Array.isArray(dims) || dims.length < 6) return false;
  if (dims.some((d) => d.source?.includes(BUILD_SOURCE) || d.source?.includes("用户手动更新"))) {
    return true;
  }
  // 六维均有有效分值也视为已构建（兼容旧数据缺 source）
  return dims.every((d) => Number(d.value) > 0);
}

export function shouldShowDashboard(
  profile: LearningProfile | null | undefined,
  profileInitialized: boolean
): boolean {
  return profileInitialized && isProfileReady(profile);
}
