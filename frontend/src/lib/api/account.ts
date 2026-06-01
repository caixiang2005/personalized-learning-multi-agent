/**
 * 个人信息 REST（user_info_api）
 *
 * | GET  | /api/user/getProfile    |
 * | POST | /api/user/updateProfile |
 * | POST | /api/user/uploadAvatar  |
 */
import type {
  AccountProfileView,
  UpdateProfileBody,
  UserProfileData,
  UserStatsDto,
} from "../../types/account";
import { apiClient, unwrap } from "./client";
import { fetchUserInfo } from "./user";
import { useAppStore } from "../../store/useAppStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const mockDelay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

async function mergeWithUserInfo(profile: UserProfileData): Promise<AccountProfileView> {
  const user = await fetchUserInfo();
  return {
    ...profile,
    email: user.email,
    registerTime: user.registerTime,
  };
}

function mockProfileData(): UserProfileData {
  const { user, profile } = useAppStore.getState();
  return {
    userId: user?.userId ?? 1,
    username: user?.username ?? "演示用户",
    phoneNumber: null,
    avatarUrl: null,
    gender: null,
    birthday: null,
    lastLoginTime: new Date().toISOString(),
    signature: null,
    major: profile.major || null,
    nickname: profile.name || null,
  };
}

function mockStats(): UserStatsDto {
  const { profile, sessions, pathStages } = useAppStore.getState();
  const topics = pathStages.flatMap((s) => s.topics);
  const pathProgress = topics.length
    ? Math.round(topics.reduce((sum, t) => sum + t.progress, 0) / topics.length)
    : 0;
  return {
    healthScore: profile.healthScore,
    goalProgress: profile.goalProgress.percent,
    pathProgress,
    sessionCount: sessions.length,
  };
}

/** GET /api/user/getProfile + getUserInfo */
export async function getAccountProfile(): Promise<AccountProfileView> {
  if (USE_MOCK) {
    await mockDelay();
    const data = mockProfileData();
    return mergeWithUserInfo(data);
  }

  const res = await apiClient.get("/user/getProfile", { skipLoading: true });
  const profile = unwrap<UserProfileData>(res);
  return mergeWithUserInfo(profile);
}

/** POST /api/user/updateProfile（部分字段） */
export async function updateAccountProfile(body: UpdateProfileBody): Promise<AccountProfileView> {
  if (USE_MOCK) {
    await mockDelay(650);
    const { setProfile } = useAppStore.getState();
    if (body.nickname !== undefined) setProfile({ name: body.nickname ?? "" });
    if (body.major !== undefined) setProfile({ major: body.major ?? "" });
    return getAccountProfile();
  }

  const res = await apiClient.post("/user/updateProfile", body);
  const updated = unwrap<UserProfileData>(res);
  syncLearningProfileStore(updated);
  return mergeWithUserInfo(updated);
}

/** POST /api/user/uploadAvatar */
export async function uploadAccountAvatar(file: File): Promise<string> {
  if (USE_MOCK) {
    await mockDelay(800);
    return `/static/avatar/${useAppStore.getState().user?.userId ?? 1}.jpg`;
  }

  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post("/user/uploadAvatar", formData);
  const data = unwrap<{ avatarUrl: string }>(res);
  return data.avatarUrl;
}

/** GET /api/user/stats（后端未实现时 fallback mock） */
export async function getUserStats(): Promise<UserStatsDto> {
  if (USE_MOCK) {
    await mockDelay(300);
    return mockStats();
  }
  try {
    const res = await apiClient.get("/user/stats", { skipLoading: true });
    return unwrap<UserStatsDto>(res);
  } catch {
    return mockStats();
  }
}

function syncLearningProfileStore(data: UserProfileData) {
  useAppStore.getState().setProfile({
    name: data.nickname ?? data.username,
    major: data.major ?? "",
  });
}

/** @deprecated 保留兼容 import */
export const getUserProfile = getAccountProfile;
export const updateUserProfile = updateAccountProfile;

export function ensureAccountMockSeed() {
  /* store 已在 AuthBootstrap / mockData 初始化 */
}
