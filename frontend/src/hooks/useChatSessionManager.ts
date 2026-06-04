/**
 * @file useChatSessionManager.ts
 * @description Chat 页会话状态：学习服务历史 + agent session_id + 联调草稿。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAgentSessionId,
  resetAgentSessionId,
  setAgentSessionId,
} from "../lib/agentChat";
import { fetchChatMessages, fetchChatSessions, type ChatHistorySource } from "../lib/api/chatHistory";
import {
  createStoredSession,
  loadDraftSessions,
  mergeApiAndDraft,
  migrateLegacyChatStorage,
  patchActiveSession,
  pickActiveId,
  saveDraftSessions,
  type ChatSessionsSnapshot,
  type StoredChatSession,
} from "../lib/chatSessions";
import type { ChatMessage } from "../types";

export interface UseChatSessionManagerOptions {
  course: string;
}

export function useChatSessionManager({ course }: UseChatSessionManagerOptions) {
  const [sessions, setSessions] = useState<StoredChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historySource, setHistorySource] = useState<ChatHistorySource>("draft");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sessionTick, setSessionTick] = useState(0);
  const draftRef = useRef<ChatSessionsSnapshot | null>(null);
  const keywordRef = useRef("");

  const persistDraft = useCallback((snapshot: ChatSessionsSnapshot) => {
    draftRef.current = snapshot;
    saveDraftSessions(snapshot);
  }, []);

  const applySnapshot = useCallback(
    (snapshot: ChatSessionsSnapshot, nextMessages?: ChatMessage[]) => {
      setActiveSessionId(snapshot.activeSessionId);
      setAgentSessionId(snapshot.activeSessionId);
      persistDraft(snapshot);
      setSessions(snapshot.sessions);
      const active = snapshot.sessions.find((s) => s.sessionId === snapshot.activeSessionId);
      setMessages(nextMessages ?? active?.messages ?? []);
      setSessionTick((n) => n + 1);
    },
    [persistDraft]
  );

  const reloadHistory = useCallback(
    async (keyword = keywordRef.current) => {
      setHistoryLoading(true);
      keywordRef.current = keyword;
      migrateLegacyChatStorage();
      draftRef.current = loadDraftSessions();

      const { sessions: apiSessions, source } = await fetchChatSessions({
        keyword: keyword || undefined,
        course,
      });

      const merged = mergeApiAndDraft(apiSessions, draftRef.current);
      const preferred = draftRef.current?.activeSessionId || getAgentSessionId();
      let activeId = pickActiveId(merged, preferred);

      if (!activeId) {
        const newId = getAgentSessionId();
        const session = createStoredSession(newId, course);
        activeId = newId;
        const snapshot = { sessions: [session], activeSessionId: activeId };
        persistDraft(snapshot);
        setSessions([session]);
        setActiveSessionId(activeId);
        setMessages([]);
        setHistorySource("draft");
        setHistoryLoading(false);
        return;
      }

      const snapshot: ChatSessionsSnapshot = {
        sessions: merged.length ? merged : [createStoredSession(activeId, course)],
        activeSessionId: activeId,
      };
      persistDraft(snapshot);
      setSessions(snapshot.sessions);
      setHistorySource(source === "api" && apiSessions.length > 0 ? "api" : "draft");
      setActiveSessionId(activeId);
      setAgentSessionId(activeId);

      const draftActive = draftRef.current?.sessions.find((s) => s.sessionId === activeId);
      if (draftActive?.messages.length) {
        setMessages(draftActive.messages);
      } else if (source === "api") {
        setMessagesLoading(true);
        const { messages: apiMsgs, source: msgSource } = await fetchChatMessages(activeId);
        setMessages(apiMsgs);
        if (msgSource === "api" && apiMsgs.length) setHistorySource("api");
        setMessagesLoading(false);
      } else {
        setMessages([]);
      }

      setHistoryLoading(false);
    },
    [course, persistDraft]
  );

  useEffect(() => {
    void reloadHistory();
  }, [reloadHistory]);

  const persistCurrentDraft = useCallback(
    (msgs: ChatMessage[], activeId = activeSessionId) => {
      if (!activeId) return;
      const base: ChatSessionsSnapshot = {
        sessions,
        activeSessionId: activeId,
      };
      const snapshot = patchActiveSession(base, msgs, course);
      persistDraft(snapshot);
      setSessions(snapshot.sessions);
    },
    [activeSessionId, course, persistDraft, sessions]
  );

  const handleNewChat = useCallback(() => {
    persistCurrentDraft(messages);
    const newId = resetAgentSessionId();
    const session = createStoredSession(newId, course);
    const snapshot: ChatSessionsSnapshot = {
      sessions: [session, ...sessions.filter((s) => s.sessionId !== newId)],
      activeSessionId: newId,
    };
    applySnapshot(snapshot, []);
  }, [applySnapshot, course, messages, persistCurrentDraft, sessions]);

  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === activeSessionId) return;
      persistCurrentDraft(messages);

      setActiveSessionId(sessionId);
      setAgentSessionId(sessionId);
      setSessionTick((n) => n + 1);

      const draftTarget = draftRef.current?.sessions.find((s) => s.sessionId === sessionId);
      if (draftTarget?.messages.length) {
        setMessages(draftTarget.messages);
        persistDraft({ sessions, activeSessionId: sessionId });
        return;
      }

      setMessagesLoading(true);
      const { messages: apiMsgs, source } = await fetchChatMessages(sessionId);
      setMessages(apiMsgs);
      if (source === "api" && apiMsgs.length) setHistorySource("api");
      setMessagesLoading(false);
      persistDraft({ sessions, activeSessionId: sessionId });
    },
    [activeSessionId, messages, persistCurrentDraft, persistDraft, sessions]
  );

  const handleSearch = useCallback(
    (keyword: string) => {
      void reloadHistory(keyword);
    },
    [reloadHistory]
  );

  return {
    sessions,
    activeSessionId,
    messages,
    setMessages,
    historySource,
    historyLoading,
    messagesLoading,
    sessionTick,
    handleNewChat,
    handleSelectSession,
    handleSearch,
    persistCurrentDraft,
    reloadHistory,
  };
}
