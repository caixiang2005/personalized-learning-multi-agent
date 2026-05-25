/**
 * @file useAppStore.ts
 * @description 全局状态（Zustand）。登录态、主题、画像、会话、消息、学习路径。
 *
 * 【当前 Mock】初始值来自 lib/mockData.ts，页面内修改仅存在内存 + localStorage 持久化。
 *
 * 【待同步后端】建议在 App 登录后或 AppLayout 挂载时请求：
 *   - fetchProfile()        → 覆盖 profile
 *   - fetchLearningPath()   → 覆盖 pathStages
 *   - fetchChatSessions()   → 覆盖 sessions
 * 消息列表 messages 建议在选中会话后 fetchMessages(sessionId)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatMessage, ChatSession, LearningProfile, PathStage } from "../types";
import { defaultProfile, defaultSessions, defaultPath } from "../lib/mockData";

interface AppState {
  /** 【当前 Mock】true 即可进系统；联调后应结合 token 是否有效 */
  isLoggedIn: boolean;
  darkMode: boolean;
  /** 【待同步】GET /api/profile */
  profile: LearningProfile;
  /** 【待同步】GET /api/chat/sessions */
  sessions: ChatSession[];
  /** 【待同步】GET /api/chat/sessions/:id/messages */
  messages: ChatMessage[];
  /** 【待同步】GET /api/learning-path */
  pathStages: PathStage[];
  profileInitialized: boolean;
  sidebarCollapsed: boolean;
  setLoggedIn: (v: boolean) => void;
  toggleDarkMode: () => void;
  setProfile: (p: Partial<LearningProfile>) => void;
  setProfileInitialized: (v: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  toggleSidebar: () => void;
  /** 【待同步】PUT /api/learning-path/resource-status */
  updateResourceStatus: (topicId: string, resourceId: string, status: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      darkMode: false,
      profile: defaultProfile,
      sessions: defaultSessions,
      messages: [],
      pathStages: defaultPath,
      profileInitialized: false,
      sidebarCollapsed: false,
      setLoggedIn: (v) => set({ isLoggedIn: v }),
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          document.documentElement.classList.toggle("dark", next);
          return { darkMode: next };
        }),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setProfileInitialized: (v) => set({ profileInitialized: v }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      setMessages: (msgs) => set({ messages: msgs }),
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
      name: "learn-platform-store",
      partialize: (s) => ({
        isLoggedIn: s.isLoggedIn,
        darkMode: s.darkMode,
        profile: s.profile,
        profileInitialized: s.profileInitialized,
        pathStages: s.pathStages,
      }),
    }
  )
);
