export interface AiSession<TMessage> {
  id: string;
  title: string;
  updatedAt: string;
  messages: TMessage[];
}

/**
 * 修复 O18：localStorage 只有 5–10MB，Agent 会话的 rawTrace 会累积大量步骤文本。
 * 这里设置两级上限：最多保留 MAX_SESSIONS 个会话（按 updatedAt 做 LRU 淘汰），
 * 每个会话最多保留 MAX_MESSAGES_PER_SESSION 条消息（保留最新的若干条）。
 */
export const MAX_SESSIONS = 30;
export const MAX_MESSAGES_PER_SESSION = 200;

export const readSessions = <TMessage>(storageKey: string): AiSession<TMessage>[] => {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AiSession<TMessage>[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item.id === 'string' && Array.isArray(item.messages))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  } catch {
    return [];
  }
};

export const writeSessions = <TMessage>(storageKey: string, sessions: AiSession<TMessage>[]) => {
  // 修复 O18：写入前做容量裁剪（会话数上限 + 单会话消息数上限），避免 localStorage 溢出
  const trimmed = sessions
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, MAX_SESSIONS)
    .map((session) =>
      session.messages.length > MAX_MESSAGES_PER_SESSION
        ? { ...session, messages: session.messages.slice(-MAX_MESSAGES_PER_SESSION) }
        : session
    );

  try {
    localStorage.setItem(storageKey, JSON.stringify(trimmed));
  } catch {
    // 配额仍然溢出时逐级降级：先只留最近 5 个会话，再失败则清理该 key
    try {
      localStorage.setItem(storageKey, JSON.stringify(trimmed.slice(0, 5)));
    } catch {
      localStorage.removeItem(storageKey);
    }
  }
};

export const upsertSession = <TMessage>(
  sessions: AiSession<TMessage>[],
  nextSession: AiSession<TMessage>
): AiSession<TMessage>[] => {
  const merged = [nextSession, ...sessions.filter((item) => item.id !== nextSession.id)];
  return merged.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const removeSession = <TMessage>(
  sessions: AiSession<TMessage>[],
  sessionId: string
): AiSession<TMessage>[] => {
  return sessions.filter((item) => item.id !== sessionId);
};

export const buildSessionId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

export const inferSessionTitle = (firstUserMessage: string, fallback: string): string => {
  const trimmed = firstUserMessage.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > 16 ? `${trimmed.slice(0, 16)}...` : trimmed;
};
