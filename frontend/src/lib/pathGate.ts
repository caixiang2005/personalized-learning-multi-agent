/**
 * 学习路径前置：须先完成对话式画像，再进入路径智能体规划
 */
import type { LearningProfile } from "../types";
import { PROFILE_BUILD_PATH } from "./navConfig";
import { needsProfileBuild, type ProfileTutorGateLocationState } from "./profileGate";
import { PATH_PLAN_PATH } from "./pathRoutes";

export type PathProfileGateState = Pick<ProfileTutorGateLocationState, "fromPathGate">;

export function resolvePathPlanTarget(
  profileInitialized: boolean,
  profile: LearningProfile | null | undefined
): { to: string; state?: PathProfileGateState } {
  if (needsProfileBuild(profileInitialized, profile)) {
    return { to: PROFILE_BUILD_PATH, state: { fromPathGate: true } };
  }
  return { to: PATH_PLAN_PATH };
}
