/**
 * @file useAppStore.ts
 * @description 全局状态（Zustand）。登录态、主题、画像、会话、消息、学习路径。
 *
 * 登录后 `dataBootstrap` 以 learn-service 为权威源覆盖 profile / path / sessions；
 * Zustand persist 写入 localStorage 仅作离线缓存。
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSession, LearningProfile, PathStage, LearningPathMeta } from "../types";
import type { UserInfo } from "../lib/api/endpoints";
import { blankProfile } from "../lib/mockData";
import { isProfileReady } from "../lib/profileReady";
import { applyTheme, THEME_STORAGE_KEY } from "../lib/theme";

export type ChatChannel = "profile" | "tutor";

interface AppState {
  isLoggedIn: boolean;
  user: UserInfo | null;
  darkMode: boolean;
  /** 学习画像 · bootstrap 后来自 GET /api/profile */
  profile: LearningProfile;
  /** 辅导会话列表 · bootstrap 后来自 GET /api/chat/sessions */
  sessions: ChatSession[];
  /** 画像智能体 /profile-build 专用会话 */
  profileBuildMessages: ChatMessage[];
  /** 智能辅导 /chat 专用会话 */
  tutorMessages: ChatMessage[];
  /** 学习路径阶段 · bootstrap 后来自 GET /api/learning-path */
  pathStages: PathStage[];
  /** 路径规划智能体 /path/plan 专用会话 */
  pathPlanMessages: ChatMessage[];
  /** 路径元信息 · bootstrap 后来自 GET /api/learning-path */
  learningPathMeta: LearningPathMeta | null;
  profileInitialized: boolean;
  sidebarCollapsed: boolean;
  /** GET getProfile · avatarUrl */
  userAvatarUrl: string | null;
  avatarCacheVersion: number;
  setSessions: (sessions: ChatSession[]) => void;
  setLoggedIn: (v: boolean) => void;
  setUser: (user: UserInfo | null) => void;
  setUserAvatar: (url: string | null, bumpVersion?: boolean) => void;
  toggleDarkMode: () => void;
  setProfile: (p: Partial<LearningProfile>) => void;
  setProfileInitialized: (v: boolean) => void;
  /** 清空画像并回到构建流程（保留用户名与智能辅导历史） */
  resetProfileForRebuild: () => void;
  addMessage: (msg: ChatMessage, channel: ChatChannel) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>, channel: ChatChannel) => void;
  setMessages: (msgs: ChatMessage[], channel: ChatChannel) => void;
  setPathPlanMessages: (msgs: ChatMessage[]) => void;
  addPathPlanMessage: (msg: ChatMessage) => void;
  updatePathPlanMessage: (id: string, patch: Partial<ChatMessage>) => void;
  /** 写入路径 · POST /api/learning-path/generate 或本地 fallback */
  setLearningPath: (stages: PathStage[], meta: LearningPathMeta) => void;
  clearLearningPath: () => void;
  toggleSidebar: () => void;
  /** 更新资源状态 · PUT /api/learning-path/resource-status */
  updateResourceStatus: (topicId: string, resourceId: string, status: string) => void;
}

function messagesFor(state: AppState, channel: ChatChannel): ChatMessage[] {
  return channel === "profile" ? state.profileBuildMessages : state.tutorMessages;
}

function normalizePersistedProfile(
  profile: LearningProfile | undefined,
  profileInitialized: boolean,
  pathStages: PathStage[]
): {
  profile: LearningProfile;
  profileInitialized: boolean;
  pathStages: PathStage[];
} {
  if (!profile || !Array.isArray(profile.learnerDimensions)) {
    return {
      profile: { ...blankProfile, name: profile?.name || blankProfile.name },
      profileInitialized: false,
      pathStages: [],
    };
  }
  if (profileInitialized && !isProfileReady(profile)) {
    return {
      profile: { ...blankProfile, name: profile.name || blankProfile.name },
      profileInitialized: false,
      pathStages: [],
    };
  }
  // 守卫 profile 内部所有数组字段，防止 localStorage 残留非数组数据导致 crash
  return {
    profile: {
      ...profile,
      learnerDimensions: Array.isArray(profile.learnerDimensions) ? profile.learnerDimensions : [],
      dimensions: Array.isArray(profile.dimensions) ? profile.dimensions : [],
      weakPoints: Array.isArray(profile.weakPoints) ? profile.weakPoints : [],
      cognitiveStyle: Array.isArray(profile.cognitiveStyle) ? profile.cognitiveStyle : [],
    },
    profileInitialized,
    pathStages: Array.isArray(pathStages) ? pathStages : [],
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      darkMode: false,
      profile: blankProfile,
      sessions: [],
      profileBuildMessages: [],
      tutorMessages: [],
      pathStages: [],
      pathPlanMessages: [],
      learningPathMeta: null,
      profileInitialized: false,
      sidebarCollapsed: false,
      userAvatarUrl: null,
      avatarCacheVersion: 0,
      setSessions: (sessions) => set({ sessions }),
      setLoggedIn: (v) => set({ isLoggedIn: v }),
      setUser: (user) =>
        set((s) => ({
          user,
          profile: user ? { ...s.profile, name: user.username } : s.profile,
          userAvatarUrl: user ? s.userAvatarUrl : null,
        })),
      setUserAvatar: (url, bumpVersion = false) =>
        set((s) => ({
          userAvatarUrl: url,
          avatarCacheVersion: bumpVersion ? s.avatarCacheVersion + 1 : s.avatarCacheVersion,
        })),
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          applyTheme(next);
          return { darkMode: next };
        }),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setProfileInitialized: (v) => set({ profileInitialized: v }),
      resetProfileForRebuild: () =>
        set((s) => ({
          profile: {
            ...blankProfile,
            name: s.user?.username || s.profile.name || blankProfile.name,
          },
          profileInitialized: false,
          profileBuildMessages: [],
        })),
      addMessage: (msg, channel) =>
        set((s) => {
          const key = channel === "profile" ? "profileBuildMessages" : "tutorMessages";
          return { [key]: [...messagesFor(s, channel), msg] };
        }),
      updateMessage: (id, patch, channel) =>
        set((s) => {
          const key = channel === "profile" ? "profileBuildMessages" : "tutorMessages";
          return {
            [key]: messagesFor(s, channel).map((m) => (m.id === id ? { ...m, ...patch } : m)),
          };
        }),
      setMessages: (msgs, channel) =>
        set(() => {
          const key = channel === "profile" ? "profileBuildMessages" : "tutorMessages";
          return { [key]: msgs };
        }),
      setPathPlanMessages: (msgs) => set({ pathPlanMessages: msgs }),
      addPathPlanMessage: (msg) =>
        set((s) => ({ pathPlanMessages: [...s.pathPlanMessages, msg] })),
      updatePathPlanMessage: (id, patch) =>
        set((s) => ({
          pathPlanMessages: s.pathPlanMessages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      setLearningPath: (stages, meta) => set({ pathStages: stages, learningPathMeta: meta }),
      clearLearningPath: () =>
        set({ pathStages: [], learningPathMeta: null, pathPlanMessages: [] }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      updateResourceStatus: (topicId, resourceId, status) =>
        set((s) => ({
          pathStages: s.pathStages.map((stage) => ({
            ...stage,
            topics: stage.topics.map((t) =>
              t.id === topicId
                ? {
                    ...t,
                    resources: t.resources.map((r) =>
                      r.id === resourceId ? { ...r, status: status as never } : r
                    ),
                  }
                : t
            ),
          })),
        })),
    }),
    {
      name: THEME_STORAGE_KEY,
      partialize: (s) => ({
        isLoggedIn: s.isLoggedIn,
        darkMode: s.darkMode,
        user: s.user,
        profile: s.profile,
        profileInitialized: s.profileInitialized,
        sessions: s.sessions,
        pathStages: s.pathStages,
        pathPlanMessages: s.pathPlanMessages,
        learningPathMeta: s.learningPathMeta,
        userAvatarUrl: s.userAvatarUrl,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>;
        const normalized = normalizePersistedProfile(
          p.profile,
          p.profileInitialized ?? current.profileInitialized,
          p.pathStages ?? current.pathStages
        );
        return {
          ...current,
          ...p,
          // 不持久化 UI 状态，始终用默认值
          sidebarCollapsed: false,
          // 守卫数组字段：防止 localStorage 残留非数组数据导致 .map/.filter crash
          sessions: Array.isArray(p.sessions) ? p.sessions : current.sessions,
          pathStages: Array.isArray(normalized.pathStages) ? normalized.pathStages : current.pathStages,
          pathPlanMessages: Array.isArray(p.pathPlanMessages) ? p.pathPlanMessages : current.pathPlanMessages,
          profile: normalized.profile,
          profileInitialized: normalized.profileInitialized,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          applyTheme(state.darkMode);
          const normalized = normalizePersistedProfile(
            state.profile,
            state.profileInitialized,
            state.pathStages
          );
          state.profile = normalized.profile;
          state.profileInitialized = normalized.profileInitialized;
          state.pathStages = normalized.pathStages;
          // 守卫所有数组字段
          state.sessions = Array.isArray(state.sessions) ? state.sessions : [];
          state.pathPlanMessages = Array.isArray(state.pathPlanMessages) ? state.pathPlanMessages : [];
        }
      },
    }
  )
);

useAppStore.persist.onFinishHydration(() => {
  applyTheme(useAppStore.getState().darkMode);
});
