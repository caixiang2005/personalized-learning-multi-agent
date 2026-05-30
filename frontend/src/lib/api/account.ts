/**
 * 个人信息页 REST 接口
 *
 * | 方法   | 路径               | 说明           |
 * |--------|--------------------|----------------|
 * | GET    | /api/user/profile  | 用户资料+学习背景 |
 * | PUT    | /api/user/update   | 更新资料        |
 * | GET    | /api/user/stats    | 统计概览        |
 * | DELETE | /api/user/profile  | 注销账号（预留）  |
 */
import type {
  UpdateUserProfileDto,
  UserProfileDto,
  UserStatsDto,
} from "../../types/account";
import { apiClient, unwrap } from "./client";
import { fetchUserInfo } from "./user";
import { useAppStore } from "../../store/useAppStore";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

const mockDelay = (ms = 450) => new Promise((r) => setTimeout(r, ms));

function mockProfileFromStore(): UserProfileDto {
  const { user, profile } = useAppStore.getState();
  return {
    userId: user?.userId ?? 1,
    email: user?.email ?? "learner@example.com",
    username: user?.username ?? profile.name,
    registerTime: user?.registerTime ?? "2026-01-15",
    displayName: profile.name,
    major: profile.major,
    goal: profile.goal,
    level: profile.level,
    updatedAt: profile.updatedAt,
  };
}

function mockStatsFromStore(): UserStatsDto {
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

/** GET /api/user/profile */
export async function getUserProfile(): Promise<UserProfileDto> {
  if (USE_MOCK) {
    await mockDelay();
    return mockProfileFromStore();
  }

  try {
    const res = await apiClient.get("/user/profile");
    return unwrap<UserProfileDto>(res);
  } catch {
    // 后端未实现时：合并 user-service + 本地画像
    const user = await fetchUserInfo();
    const { profile } = useAppStore.getState();
    return {
      userId: user.userId,
      email: user.email,
      username: user.username,
      registerTime: user.registerTime,
      displayName: profile.name,
      major: profile.major,
      goal: profile.goal,
      level: profile.level,
      updatedAt: profile.updatedAt,
    };
  }
}

/** PUT /api/user/update */
export async function updateUserProfile(body: UpdateUserProfileDto): Promise<UserProfileDto> {
  if (USE_MOCK) {
    await mockDelay(650);
    const { setProfile } = useAppStore.getState();
    setProfile({
      name: body.displayName,
      major: body.major,
      goal: body.goal,
      level: body.level,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    return mockProfileFromStore();
  }

  try {
    const res = await apiClient.put("/user/update", body);
    const data = unwrap<UserProfileDto>(res);
    syncProfileToStore(data);
    return data;
  } catch {
    await mockDelay(650);
    const { setProfile } = useAppStore.getState();
    setProfile({
      name: body.displayName,
      major: body.major,
      goal: body.goal,
      level: body.level,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
    return mockProfileFromStore();
  }
}

/** GET /api/user/stats */
export async function getUserStats(): Promise<UserStatsDto> {
  if (USE_MOCK) {
    await mockDelay(300);
    return mockStatsFromStore();
  }

  try {
    const res = await apiClient.get("/user/stats", { skipLoading: true });
    return unwrap<UserStatsDto>(res);
  } catch {
    return mockStatsFromStore();
  }
}

/** DELETE /api/user/profile — 预留，后端未实现 */
export async function deleteUserProfile(): Promise<void> {
  if (USE_MOCK) {
    await mockDelay();
    return;
  }
  await apiClient.delete("/user/profile");
}

function syncProfileToStore(data: UserProfileDto) {
  useAppStore.getState().setProfile({
    name: data.displayName,
    major: data.major,
    goal: data.goal,
    level: data.level,
    updatedAt: data.updatedAt,
  });
}

/** Mock 占位：后端未就绪时使用 store 数据 */
export function ensureAccountMockSeed() {
  /* store 已在 AuthBootstrap / mockData 初始化 */
}
