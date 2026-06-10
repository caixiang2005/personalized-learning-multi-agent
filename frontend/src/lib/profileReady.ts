/**
 * @file profileReady.ts
 * @description 判断用户是否已通过对话完成画像构建（区分旧 mock / 未构建）
 */
import type { LearningProfile } from "../types";

const BUILD_SOURCE = "对话画像构建";

export function isProfileReady(profile: LearningProfile | null | undefined): boolean {
  const dims = profile?.learnerDimensions;
  if (!Array.isArray(dims)) return false;
  return dims.some((d) => d.source === BUILD_SOURCE);
}

export function shouldShowDashboard(
  profile: LearningProfile | null | undefined,
  profileInitialized: boolean
): boolean {
  return profileInitialized && isProfileReady(profile);
}
