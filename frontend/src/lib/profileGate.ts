/**
 * 智能辅导 /chat 与画像构建 /profile-build 的前置门禁
 */
import type { LearningProfile } from "../types";
import { PROFILE_BUILD_PATH } from "./navConfig";
import { isProfileReady } from "./profileReady";

export const TUTOR_CHAT_PATH = "/chat";

export type ProfileTutorGateLocationState = {
  /** 从「智能辅导」入口被引导至画像构建 */
  fromTutorGate?: boolean;
  /** 从「学习路径 / 路径规划」入口被引导至画像构建 */
  fromPathGate?: boolean;
  intent?: string;
};

export function needsProfileBuild(
  profileInitialized: boolean,
  profile: LearningProfile | null | undefined
): boolean {
  return !profileInitialized || !isProfileReady(profile);
}

export function resolveTutorNavTarget(
  profileInitialized: boolean,
  profile: LearningProfile | null | undefined
): { to: string; state?: ProfileTutorGateLocationState } {
  if (needsProfileBuild(profileInitialized, profile)) {
    return { to: PROFILE_BUILD_PATH, state: { fromTutorGate: true } };
  }
  return { to: TUTOR_CHAT_PATH };
}

export function isTutorNavActive(
  pathname: string,
  profileInitialized: boolean,
  profile: LearningProfile | null | undefined
): boolean {
  if (pathname.startsWith(TUTOR_CHAT_PATH)) return true;
  return needsProfileBuild(profileInitialized, profile) && pathname === PROFILE_BUILD_PATH;
}
