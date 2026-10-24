import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sendMessageStream } from '../services';
import { type AiSession, buildSessionId, inferSessionTitle, readSessions, removeSession, upsertSession, writeSessions } from '../utils/aiSession';
import { buildUserScopedStorageKey } from '../utils/auth';
import defaultAvatar from '../assets/unnamed.png';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '嗨！我是小灵，您的专属行程助理。您想去哪里旅行？或者需要我帮您规划成都的行程吗？',
  timestamp: new Date().toISOString(),
};

// 会话存储按用户隔离：实际 key 为 `${BASE_KEY}:${userId}`，未登录用 guest
const CHAT_STORAGE_BASE_KEY = 'travel_chat_sessions_v1';

const createWelcomeMessage = (): Message => ({
  ...WELCOME_MESSAGE,
  timestamp: new Date().toISOString(),
});

const createSession = (): AiSession<Message> => ({
  id: buildSessionId('chat'),
  title: '新对话',
  updatedAt: new Date().toISOString(),
  messages: [createWelcomeMessage()],
});

const isSameMessages = (a: Message[], b: Message[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].role !== b[i].role || a[i].content !== b[i].content || a[i].timestamp !== b[i].timestamp) {
      return false;
    }
  }
  return true;
};

export default function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  // 按登录用户隔离的会话存储 key（未登录为 guest）
  const storageKey = buildUserScopedStorageKey(CHAT_STORAGE_BASE_KEY);
  const [showMenu, setShowMenu] = useState(false);
  const [sessions, setSessions] = useState<AiSession<Message>[]>(() => {
    const existing = readSessions<Message>(storageKey);
    return existing.length > 0 ? existing : [createSession()];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const existing = readSessions<Message>(storageKey);
    return existing[0]?.id || createSession().id;
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const existing = readSessions<Message>(storageKey);
    return existing[0]?.messages || [createWelcomeMessage()];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentAiMessage, setCurrentAiMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 修复 E50：标记「本次 messages 变化来自 sessions 同步」，
  // 让回写 effect 跳过这一次，避免 sessions ↔ messages 双向同步形成渲染循环。
  const syncingFromSessionsRef = useRef(false);

  // 登录用户变化时（storageKey 内含用户标识），重新加载该用户的会话
  useEffect(() => {
    const existing = readSessions<Message>(storageKey);
    setSessions(existing.length > 0 ? existing : [createSession()]);
    setActiveSessionId(existing[0]?.id || createSession().id);
    setMessages(existing[0]?.messages || [createWelcomeMessage()]);
  }, [storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAiMessage]);

  useEffect(() => {
    writeSessions(storageKey, sessions);
  }, [sessions, storageKey]);

  useEffect(() => {
    const active = sessions.find((item) => item.id === activeSessionId);
    if (!active) {
      const fallback = sessions[0];
      if (fallback) {
        setActiveSessionId(fallback.id);
        setMessages(fallback.messages);
      }
      return;
    }

    if (!isSameMessages(active.messages, messages)) {
      syncingFromSessionsRef.current = true;
      setMessages(active.messages);
      setCurrentAiMessage('');
      setIsTyping(false);
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    // 修复 E50：消费「来自 sessions 的同步」标记，跳过本次回写，避免双向同步循环
    if (syncingFromSessionsRef.current) {
      syncingFromSessionsRef.current = false;
      return;
    }
    setSessions((prev) => {
      const index = prev.findIndex((item) => item.id === activeSessionId);
      if (index < 0) return prev;

      const current = prev[index];
      if (isSameMessages(current.messages, messages)) {
        return prev;
      }

      const firstUser = messages.find((item) => item.role === 'user')?.content || '';
      const fallback = `对话 ${new Date().toLocaleDateString('zh-CN')}`;
      const next = {
        ...current,
        title: inferSessionTitle(firstUser, fallback),
        updatedAt: new Date().toISOString(),
        messages,
      };
      return upsertSession(prev, next);
    });
  }, [activeSessionId, messages]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const prefill = params.get('prefill');
    if (!prefill) {
      return;
    }
    setInputMessage(prefill);
  }, [location.search]);

  const handleSendMessage = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setCurrentAiMessage('');

    let accumulated = '';

    try {
      await sendMessageStream(
        trimmed,
        activeSessionId,
        (chunk) => {
          accumulated += chunk;
          setCurrentAiMessage(accumulated);
        },
        () => {
          const finalMessage = accumulated.trim() || '抱歉，我暂时没有生成有效回复，请稍后重试。';
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: finalMessage,
              timestamp: new Date().toISOString(),
            },
          ]);
          setCurrentAiMessage('');
          setIsTyping(false);
        },
        (error) => {
          console.error('聊天错误:', error);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: '抱歉，发生了一些错误，请稍后再试。',
              timestamp: new Date().toISOString(),
            },
          ]);
          setCurrentAiMessage('');
          setIsTyping(false);
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '发送失败，请检查网络后重试。',
          timestamp: new Date().toISOString(),
        },
      ]);
      setCurrentAiMessage('');
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    const nextSession = createSession();
    setSessions((prev) => upsertSession(prev, nextSession));
    setActiveSessionId(nextSession.id);
    setMessages(nextSession.messages);
    setCurrentAiMessage('');
    setInputMessage('');
    setIsTyping(false);
    setShowMenu(false);
  };

  const handleClearCurrent = () => {
    const clearedMessages = [createWelcomeMessage()];
    setMessages(clearedMessages);
    setInputMessage('');
    setCurrentAiMessage('');
    setIsTyping(false);
    setShowMenu(false);
  };

  const handleSwitchSession = (sessionId: string) => {
    if (isTyping) return;
    setActiveSessionId(sessionId);
    setInputMessage('');
    setCurrentAiMessage('');
    setShowMenu(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (isTyping) return;

    const rest = removeSession(sessions, sessionId);
    if (rest.length === 0) {
      const next = createSession();
      setSessions([next]);
      setActiveSessionId(next.id);
      setMessages(next.messages);
    } else {
      setSessions(rest);
      const nextActive = activeSessionId === sessionId ? rest[0].id : activeSessionId;
      setActiveSessionId(nextActive);
      const nextMessages = rest.find((item) => item.id === nextActive)?.messages || rest[0].messages;
      setMessages(nextMessages);
    }

    setInputMessage('');
    setCurrentAiMessage('');
    setShowMenu(false);
  };

  const handleQuickReply = (text: string) => {
    setInputMessage(text);
  };

  const assistantStatusText = isTyping ? '对方正在输入...' : '您的智能行程助理';

  return (
    <main className="flex flex-col h-screen bg-surface text-on-surface font-body relative">
      <header className="flex justify-between items-center px-4 py-4 bg-surface/90 backdrop-blur-md z-30 sticky top-0 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <button
            aria-label="返回"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm relative">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-fixed rounded-full border-2 border-surface"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline leading-none text-on-surface">智能对话</h1>
              <span className={`text-xs font-medium ${isTyping ? 'text-primary' : 'text-on-surface-variant'}`}>
                {assistantStatusText}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-on-surface-variant w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">more_vert</span>
          </button>

          {showMenu && (
            <div className="absolute top-12 right-0 w-40 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-low overflow-hidden z-50">
              <button
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-on-surface flex items-center gap-2"
                onClick={handleNewChat}
              >
                <span className="material-symbols-outlined text-[18px]">add_comment</span>
                新建对话
              </button>
              <button
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-error flex items-center gap-2 border-t border-surface-container-low"
                onClick={handleClearCurrent}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                清空对话
              </button>

              {sessions.length > 0 && (
                <div className="border-t border-surface-container-low">
                  <p className="px-4 py-2 text-[11px] text-on-surface-variant font-semibold">历史会话</p>
                  <div className="max-h-56 overflow-y-auto">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="flex items-center">
                        <button
                          className={`flex-1 px-4 py-2.5 text-left text-xs truncate transition-colors ${
                            session.id === activeSessionId ? 'bg-primary-container/40 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-low'
                          }`}
                          onClick={() => handleSwitchSession(session.id)}
                        >
                          {session.title || '未命名会话'}
                        </button>
                        <button
                          className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="px-4 pt-3">
        <Link
          to="/agent"
          className="inline-flex items-center gap-1 rounded-full bg-primary-container/40 text-primary text-xs font-semibold px-3 py-1.5"
        >
          <span className="material-symbols-outlined text-[14px]">psychology</span>
          切换到智能体模式
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 flex flex-col pb-36">
        <div className="text-center">
          <span className="bg-surface-container-low text-on-surface-variant text-[11px] px-3 py-1 rounded-full font-medium">
            {new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {messages.map((msg, index) => (
          <div
            key={`${msg.timestamp}-${index}`}
            className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden">
              {msg.role === 'assistant' ? (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    smart_toy
                  </span>
                </div>
              ) : (
                <img
                  className="w-full h-full object-cover"
                  alt="User"
                  src={defaultAvatar}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div
                className={`${
                  msg.role === 'assistant'
                    ? 'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm'
                    : 'bg-primary text-white rounded-2xl rounded-tr-sm'
                } p-4 text-sm leading-relaxed shadow-sm`}
              >
                {msg.content}
              </div>

              {msg.role === 'assistant' && index === 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    className="border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors active:scale-95 bg-surface cursor-pointer"
                    onClick={() => handleQuickReply('帮我规划成都三日游')}
                  >
                    帮我规划成都三日游
                  </button>
                  <button
                    className="border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors active:scale-95 bg-surface cursor-pointer"
                    onClick={() => handleQuickReply('推荐周末短途游')}
                  >
                    推荐周末短途游
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm relative min-h-[3rem]">
                {currentAiMessage || '正在思考中...'}
                <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-pulse"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border-t border-surface-container px-4 py-3 fixed bottom-0 w-full z-40 pb-safe">
        <div className="flex items-center gap-2 bg-surface-container-low rounded-[1.5rem] p-2 focus-within:ring-2 ring-primary/30 transition-shadow">
          <button className="w-10 h-10 flex flex-shrink-0 items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined">add_circle</span>
          </button>

          <textarea
            className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2 text-sm leading-6 font-medium text-on-surface placeholder:text-on-surface-variant/70 no-scrollbar"
            placeholder="输入您想去的地方或需求..."
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isTyping}
          />

          <button
            className="w-10 h-10 flex flex-shrink-0 items-center justify-center bg-primary rounded-full text-white shadow-md active:scale-90 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendMessage}
            disabled={isTyping || !inputMessage.trim()}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              arrow_upward
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
