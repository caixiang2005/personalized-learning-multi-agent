/**
 * @file dataBootstrap.ts
 * @description 应用启动时从后端 Hydrate Zustand Store 的数据引导层。
 *
 * 在 AuthBootstrap 用户登录确认后调用 bootstrapAppData()，
 * 若后端未就绪则静默降级（保持现有 mock 数据）。
 */
import { useAppStore } from "../store/useAppStore";
import {
  fetchProfile,
  fetchLearningPath,
  fetchChatSessions,
} from "./api/learn";
import { isProfileReady } from "./profileReady";

/** 用户登录后，并行拉取核心数据，填充 Zustand store。 */
export async function bootstrapAppData(): Promise<void> {
  const store = useAppStore.getState();

  // 仅当用户已登录才拉取
  if (!store.user?.userId) return;

  const results = await Promise.allSettled([
    fetchProfile().catch(() => null),
    fetchLearningPath().catch(() => null),
    fetchChatSessions().catch(() => null),
  ]);

  // 1. 画像
  const profileRes = results[0].status === "fulfilled" ? results[0].value : null;
  if (profileRes?.code === 200 && profileRes.data) {
    const p = profileRes.data;
    store.setProfile(p);
    if (isProfileReady(p)) {
      store.setProfileInitialized(true);
    }
  }

  // 2. 学习路径
  const pathRes = results[1].status === "fulfilled" ? results[1].value : null;
  if (pathRes?.code === 200 && pathRes.data) {
    store.setLearningPath(pathRes.data.stages ?? [], {
      id: pathRes.data.id ?? "",
      title: pathRes.data.title ?? "",
      course: pathRes.data.course ?? "",
      generatedAt: pathRes.data.generatedAt ?? "",
      source: pathRes.data.source ?? "mock",
      overallProgress: pathRes.data.overallProgress ?? 0,
    });
  }

  // 3. 会话列表
  const sessionsRes = results[2].status === "fulfilled" ? results[2].value : null;
  if (sessionsRes?.code === 200 && Array.isArray(sessionsRes.data)) {
    store.setSessions(sessionsRes.data);
  }
}

/** 手动刷新所有数据（导航回 /home 时等） */
export async function refreshAppData(): Promise<void> {
  await bootstrapAppData();
}
