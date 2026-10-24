import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createItineraryFromAi, sendManusMessageStream } from '../services';
import { type AiSession, buildSessionId, inferSessionTitle, readSessions, removeSession, upsertSession, writeSessions } from '../utils/aiSession';
import { BACKEND_ORIGIN } from '../utils/network';
import defaultAvatar from '../assets/unnamed.png';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  pdfUrls?: string[];
  structured?: AgentStructuredView;
}

interface AgentToolCall {
  step: string;
  tool: string;
  summary: string;
  output?: string;
}

interface AgentStructuredView {
  reasoningSteps: string[];
  toolCalls: AgentToolCall[];
  resultText: string;
  rawTrace: string[];
  artifacts: AgentArtifact[];
  hasFinalEvent: boolean;
  hasDoneEvent: boolean;
  isCompleted: boolean;
  /** 修复 O23：本次任务的 runId，用于「查看完整过程」 */
  runId?: string;
}

interface AgentArtifact {
  name?: string;
  mimeType?: string;
  downloadUrl?: string;
}

interface AiItineraryDraft {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
}

interface SaveSheetState {
  messageKey: string;
  aiContent: string;
  pdfUrl?: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
}

const BACKEND_BASE_URL = BACKEND_ORIGIN;

const normalizeDownloadUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${BACKEND_BASE_URL}${trimmed}`;
  return `${BACKEND_BASE_URL}/${trimmed}`;
};

const buildDownloadCandidates = (url: string): string[] => {
  const normalized = normalizeDownloadUrl(url);
  if (!normalized) return [];

  const candidates = new Set<string>([normalized]);

  try {
    const parsed = new URL(normalized);
    const path = parsed.pathname;

    if (path.startsWith('/api/files/')) {
      const noApi = `${parsed.origin}${path.replace(/^\/api/, '')}${parsed.search}`;
      const doubleApi = `${parsed.origin}/api${path}${parsed.search}`;
      candidates.add(noApi);
      candidates.add(doubleApi);
    }

    if (path.startsWith('/files/')) {
      const withApi = `${parsed.origin}/api${path}${parsed.search}`;
      candidates.add(withApi);
    }
  } catch {
    // 非法 URL 时仅使用原始归一化地址
  }

  return Array.from(candidates);
};

const getFilenameFromContentDisposition = (headerValue: string | null): string | null => {
  if (!headerValue) return null;
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) return plainMatch[1];
  return null;
};

const normalizeReasoningSteps = (steps: string[]): string[] => {
  const normalized: string[] = [];
  for (const step of steps) {
    if (!step) continue;
    if (normalized[normalized.length - 1] !== step) {
      normalized.push(step);
    }
  }
  return normalized;
};

const isPdfArtifact = (artifact: AgentArtifact): boolean => {
  const name = (artifact.name || '').toLowerCase();
  const mime = (artifact.mimeType || '').toLowerCase();
  const url = (artifact.downloadUrl || '').toLowerCase();
  return name.endsWith('.pdf') || mime.includes('pdf') || /\.pdf(\?|$)/.test(url);
};

const isTxtArtifact = (artifact: AgentArtifact): boolean => {
  const name = (artifact.name || '').toLowerCase();
  const mime = (artifact.mimeType || '').toLowerCase();
  const url = (artifact.downloadUrl || '').toLowerCase();
  return name.endsWith('.txt') || mime.includes('text/plain') || /\.txt(\?|$)/.test(url);
};

const containsRawJson = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const jsonLike = (trimmed.startsWith('{') || trimmed.startsWith('[')) && trimmed.length > 120;
  const hasManyJsonKeys = /"position"|"title"|"snippet"|"displayed_link"/i.test(trimmed);
  return jsonLike || hasManyJsonKeys;
};

const summarizeResultText = (
  text: string,
  toolCalls: AgentToolCall[],
  rawTrace: string[],
  isCompleted: boolean
): string => {
  const trimmed = text.trim();
  if (!trimmed || /^任务结束$/i.test(trimmed)) {
    if (!isCompleted) {
      return `正在执行任务，已完成 ${toolCalls.length} 步工具调用。`;
    }
    return `任务已完成，共执行 ${toolCalls.length} 步工具调用。`;
  }

  const pdfMatch = rawTrace
    .join('\n')
    .match(/(https?:\/\/[^\s"')]+\.pdf(?:\?[^\s"')]*)?|[A-Za-z]:\\[^\s"']+\.pdf|\/[^\s"']+\.pdf)/i);

  if (pdfMatch?.[1]) {
    if (!isCompleted) {
      return `已生成 PDF 文件，正在整理最终结果：${pdfMatch[1]}`;
    }
    return `任务已完成，已生成 PDF 文件：${pdfMatch[1]}`;
  }

  if (containsRawJson(trimmed)) {
    const toolSummary = toolCalls.length > 0 ? `共执行 ${toolCalls.length} 步工具调用。` : '';
    if (!isCompleted) {
      return `正在处理，已获取结构化检索结果。${toolSummary}`;
    }
    return `任务已完成，已获取结构化检索结果。${toolSummary}`;
  }

  if (!isCompleted && /(任务已完成|已完成|成功)/.test(trimmed)) {
    return '任务仍在执行，正在等待后端返回最终结果...';
  }

  return trimmed;
};

const WELCOME_AGENT_MESSAGE: AgentMessage = {
  role: 'assistant',
  content:
    '您好，我是智能体助手。我可以根据您的需求自动检索信息、生成行程方案，并在结果中返回可下载的 PDF 文件链接。',
  timestamp: new Date().toISOString(),
};

const AGENT_STORAGE_KEY = 'travel_agent_sessions_v1';

const createAgentWelcomeMessage = (): AgentMessage => ({
  ...WELCOME_AGENT_MESSAGE,
  timestamp: new Date().toISOString(),
});

const createAgentSession = (): AiSession<AgentMessage> => ({
  id: buildSessionId('agent'),
  title: '新任务',
  updatedAt: new Date().toISOString(),
  messages: [createAgentWelcomeMessage()],
});

const isSameAgentMessages = (a: AgentMessage[], b: AgentMessage[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (left.role !== right.role || left.content !== right.content || left.timestamp !== right.timestamp) {
      return false;
    }
    if (JSON.stringify(left.structured || null) !== JSON.stringify(right.structured || null)) {
      return false;
    }
    if (JSON.stringify(left.pdfUrls || []) !== JSON.stringify(right.pdfUrls || [])) {
      return false;
    }
  }
  return true;
};

const splitSsePayloadEntries = (payload: string): string[] => {
  const normalized = payload.replace(/^data:\s*/i, '').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const byLine = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const entries: string[] = [];
  for (const line of byLine) {
    const segmented = line
      .split(/(?=(?:Step|步骤)\s*\d+\s*[:：])/gi)
      .map((item) => item.trim())
      .filter(Boolean);

    if (segmented.length > 0) {
      entries.push(...segmented);
    } else {
      entries.push(line);
    }
  }

  return entries;
};

const containsPdfIntent = (text: string): boolean => /pdf|行程单|导出|下载/i.test(text);

const looksLikeItineraryRequest = (text: string): boolean =>
  /(行程|规划|路线|旅游|旅行|攻略|半日游|一日游|两日游|三日游|n日游|景点)/i.test(text);

const buildManusPrompt = (userInput: string): { prompt: string; forcedPdf: boolean } => {
  const trimmed = userInput.trim();
  if (!trimmed) {
    return { prompt: '', forcedPdf: false };
  }

  if (containsPdfIntent(trimmed) || !looksLikeItineraryRequest(trimmed)) {
    return { prompt: trimmed, forcedPdf: false };
  }

  return {
    prompt: `${trimmed}\n\n请在完成规划后，务必生成可下载的 PDF 行程单，并同时输出一个 txt 文本版本（用于在聊天中展示最终答复）。`,
    forcedPdf: true,
  };
};

const buildStructuredView = (entries: string[], isCompleted: boolean): AgentStructuredView => {
  const reasoningSteps: string[] = [];
  const toolCalls: AgentToolCall[] = [];
  const rawTrace: string[] = [];
  const finalCandidates: string[] = [];
  const plainTextCandidates: string[] = [];
  const artifacts: AgentArtifact[] = [];
  let hasFinalEvent = false;
  let hasDoneEvent = false;
  // 修复 O23：从事件流中提取 runId，供「查看完整过程」跳转使用
  let runId = '';

  const pushToolCall = (step: string, tool: string, summary: string, output?: string) => {
    toolCalls.push({
      step,
      tool,
      summary,
      output,
    });
  };

  for (const entry of entries) {
    const cleaned = entry.trim();
    if (!cleaned) continue;

    rawTrace.push(cleaned);

    if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
      try {
        const event = JSON.parse(cleaned) as {
          type?: string;
          step?: number | string;
          runId?: string;
          data?: Record<string, unknown> | string;
          content?: string;
          message?: string;
          tool?: string;
          summary?: string;
          output?: string;
          answer?: string;
        };
        if (!runId && typeof event.runId === 'string' && event.runId) {
          runId = event.runId;
        }
        const eventType = String(event.type || '').toLowerCase();
        const step = `Step ${event.step ?? toolCalls.length + 1}`;
        const dataObj = typeof event.data === 'object' && event.data ? event.data : undefined;

        if (eventType === 'thought') {
          const thoughtText =
            (dataObj?.content as string) ||
            (dataObj?.title as string) ||
            (event.content as string) ||
            (event.message as string) ||
            JSON.stringify(event.data || '');
          if (thoughtText) reasoningSteps.push(`${step}：${thoughtText}`);
          continue;
        }

        if (eventType === 'tool_call') {
          const toolName =
            (dataObj?.tool as string) ||
            (event.tool as string) ||
            (dataObj?.name as string) ||
            'tool';
          const summary = (dataObj?.summary as string) || (event.summary as string) || '开始执行工具';
          pushToolCall(step, toolName, summary);
          reasoningSteps.push(`${step}：调用工具 ${toolName}`);
          continue;
        }

        if (eventType === 'tool_result') {
          const toolName =
            (dataObj?.tool as string) ||
            (event.tool as string) ||
            (toolCalls[toolCalls.length - 1]?.tool ?? 'tool');
          const summary =
            (dataObj?.summary as string) ||
            (event.summary as string) ||
            (dataObj?.message as string) ||
            '工具执行完成';
          const output =
            (dataObj?.output as string) ||
            (event.output as string) ||
            (dataObj?.result as string) ||
            undefined;

          const last = toolCalls[toolCalls.length - 1];
          if (last && last.tool === toolName && !last.output) {
            last.output = output || summary;
            last.summary = summary;
          } else {
            pushToolCall(step, toolName, summary, output || summary);
          }
          reasoningSteps.push(`${step}：${toolName} 已返回结果`);
          continue;
        }

        if (eventType === 'artifact') {
          const artifactUrl =
            (dataObj?.downloadUrl as string) || (dataObj?.url as string) || (dataObj?.path as string) || '';
          const artifactName = (dataObj?.name as string) || (dataObj?.fileName as string) || '文件';
          artifacts.push({
            name: artifactName,
            mimeType: (dataObj?.mimeType as string) || undefined,
            downloadUrl: artifactUrl || undefined,
          });
          if (artifactUrl) {
            finalCandidates.push(`已生成文件 ${artifactName}：${artifactUrl}`);
          } else {
            finalCandidates.push(`已生成文件 ${artifactName}`);
          }
          continue;
        }

        if (eventType === 'final') {
          hasFinalEvent = true;
          const answer =
            (dataObj?.answer as string) ||
            (event.answer as string) ||
            (dataObj?.content as string) ||
            (event.content as string) ||
            '';
          if (answer.trim()) finalCandidates.push(answer.trim());
          continue;
        }

        if (eventType === 'done') {
          hasDoneEvent = true;
          continue;
        }

        if (eventType === 'error') {
          const errText =
            (dataObj?.message as string) || (event.message as string) || '任务执行失败，请稍后重试。';
          finalCandidates.push(errText);
          continue;
        }
      } catch {
        // 保持向下兼容原有纯文本 Step 解析
      }
    }

    const stepMatch = cleaned.match(/^(Step\s*\d+|步骤\s*\d+)\s*[:：]\s*(.*)$/i);
    if (stepMatch) {
      const step = stepMatch[1].replace(/\s+/g, ' ');
      const body = stepMatch[2].trim();
      const toolMatch = body.match(/(?:工具|tool)\s*([A-Za-z_][\w-]*)/i);
      const resultMatch = body.match(/结果\s*[:：]\s*(.*)$/i);
      const summary = body.replace(/结果\s*[:：].*$/i, '').trim() || body;

      reasoningSteps.push(`${step}：${summary}`);

      if (toolMatch) {
        toolCalls.push({
          step,
          tool: toolMatch[1],
          summary,
          output: resultMatch?.[1]?.trim(),
        });
      }

      if (resultMatch?.[1] && /(generatepdf|writefile|返回|输出|完成)/i.test(summary)) {
        finalCandidates.push(resultMatch[1].trim());
      }
      continue;
    }

    const finalMatch = cleaned.match(/^(最终结果|最终答复|任务结果|结果)\s*[:：]\s*(.*)$/i);
    if (finalMatch) {
      hasFinalEvent = true;
      if (finalMatch[2].trim()) finalCandidates.push(finalMatch[2].trim());
      continue;
    }

    if (/^(任务结束|done)$/i.test(cleaned)) {
      hasDoneEvent = true;
      continue;
    }

    if (!/^(event:|id:|retry:)/i.test(cleaned)) {
      plainTextCandidates.push(cleaned);
    }
  }

  const fallbackToolOutput = [...toolCalls].reverse().find((item) => item.output && item.output.trim())?.output || '';
  const rawResult =
    [...finalCandidates].reverse().find((text) => text && !/^任务结束$/i.test(text)) ||
    plainTextCandidates[plainTextCandidates.length - 1] ||
    fallbackToolOutput ||
    '';
  const doneByEvent = hasDoneEvent || hasFinalEvent;
  const completionState = isCompleted || doneByEvent;
  const resultText = summarizeResultText(rawResult, toolCalls, rawTrace, completionState);

  return {
    reasoningSteps: normalizeReasoningSteps(reasoningSteps),
    toolCalls,
    resultText,
    rawTrace,
    artifacts,
    hasFinalEvent,
    hasDoneEvent,
    isCompleted: completionState,
    runId: runId || undefined,
  };
};

const shortenText = (text: string, max = 160): string => {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
};

const formatDateToIso = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};


const inferDestinationFromTitle = (title: string): string => {
  const normalized = title.trim();
  if (!normalized) return '';
  if (normalized.includes('行程')) {
    const stripped = normalized.replace(/行程|旅行|旅游|攻略|计划/g, '').trim();
    return stripped || '';
  }
  return '';
};

const normalizeDateInput = (raw: string): string | null => {
  const text = raw.trim();
  if (!text) return null;

  const isoMatch = text.match(/^(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})日?$/);
  if (!isoMatch) return null;

  const year = Number(isoMatch[1]);
  const month = Number(isoMatch[2]);
  const day = Number(isoMatch[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return formatDateToIso(parsed);
};

const extractDraftFromMessage = (msg: AgentMessage): AiItineraryDraft => {
  const text = `${msg.content}\n${msg.structured?.rawTrace.join('\n') || ''}`;
  const now = new Date();
  const defaultStart = formatDateToIso(now);
  const defaultEnd = formatDateToIso(new Date(now.getTime() + 24 * 60 * 60 * 1000));

  const datePattern = /(20\d{2})\s*[-./年]\s*(\d{1,2})\s*[-./月]\s*(\d{1,2})\s*(?:日)?/g;
  const extractedDates: string[] = [];

  for (const match of text.matchAll(datePattern)) {
    if (!match[0]) continue;
    const normalized = normalizeDateInput(match[0]);
    if (normalized) extractedDates.push(normalized);
    if (extractedDates.length >= 2) break;
  }

  const destinationMatch = text.match(/(?:去|到|前往|目的地[是为:]?)\s*([\u4e00-\u9fa5A-Za-z·]{2,20})/);
  const destination = destinationMatch?.[1] || '';

  const titleLine = text
    .split('\n')
    .map((line) => line.trim().replace(/^#+\s*/, ''))
    .find((line) => line.length > 0 && line.length <= 36 && /(行程|旅游|旅行)/.test(line));
  const title = titleLine || (destination ? `${destination}行程` : '我的AI行程');
  const inferredDestination = destination || inferDestinationFromTitle(title);

  const travelersMatch = text.match(/(\d{1,2})\s*(?:人|位)/);
  const travelers = travelersMatch?.[1] ? Number(travelersMatch[1]) : 2;

  return {
    title,
    destination: inferredDestination,
    startDate: extractedDates[0] || defaultStart,
    endDate: extractedDates[1] || defaultEnd,
    travelers: Number.isFinite(travelers) && travelers > 0 ? travelers : 2,
  };
};

const buildSaveSheetState = (msg: AgentMessage, index: number): SaveSheetState => {
  const messageKey = `${msg.timestamp}-${index}`;
  const draft = extractDraftFromMessage(msg);

  return {
    messageKey,
    aiContent: msg.content,
    pdfUrl: msg.pdfUrls?.[0],
    title: draft.title,
    destination: draft.destination,
    startDate: draft.startDate,
    endDate: draft.endDate,
    travelers: draft.travelers,
  };
};

function TypewriterText({ text, className }: { text: string; className?: string }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let current = 0;
    setDisplayText('');

    if (!text) return;

    const timer = window.setInterval(() => {
      current += 2;
      if (current >= text.length) {
        setDisplayText(text);
        window.clearInterval(timer);
        return;
      }
      setDisplayText(text.slice(0, current));
    }, 16);

    return () => window.clearInterval(timer);
  }, [text]);

  return <p className={className}>{displayText}</p>;
}

export default function Agent() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [sessions, setSessions] = useState<AiSession<AgentMessage>[]>(() => {
    const existing = readSessions<AgentMessage>(AGENT_STORAGE_KEY);
    return existing.length > 0 ? existing : [createAgentSession()];
  });
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const existing = readSessions<AgentMessage>(AGENT_STORAGE_KEY);
    return existing[0]?.id || createAgentSession().id;
  });
  const [messages, setMessages] = useState<AgentMessage[]>(() => {
    const existing = readSessions<AgentMessage>(AGENT_STORAGE_KEY);
    return existing[0]?.messages || [createAgentWelcomeMessage()];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingView, setStreamingView] = useState<AgentStructuredView | null>(null);
  const [expandedReasoningMap, setExpandedReasoningMap] = useState<Record<string, boolean>>({});
  const [streamReasoningExpanded, setStreamReasoningExpanded] = useState(true);
  const [streamTypedText, setStreamTypedText] = useState('');
  const [savingMessageKey, setSavingMessageKey] = useState<string | null>(null);
  const [saveSheet, setSaveSheet] = useState<SaveSheetState | null>(null);
  const [saveSheetError, setSaveSheetError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingView]);

  useEffect(() => {
    writeSessions(AGENT_STORAGE_KEY, sessions);
  }, [sessions]);

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

    if (!isSameAgentMessages(active.messages, messages)) {
      setMessages(active.messages);
      setStreamingView(null);
      setIsTyping(false);
      setStreamTypedText('');
    }
  }, [activeSessionId, sessions]);

  useEffect(() => {
    setSessions((prev) => {
      const index = prev.findIndex((item) => item.id === activeSessionId);
      if (index < 0) return prev;

      const current = prev[index];
      if (isSameAgentMessages(current.messages, messages)) {
        return prev;
      }

      const firstUser = messages.find((item) => item.role === 'user')?.content || '';
      const fallback = `任务 ${new Date().toLocaleDateString('zh-CN')}`;
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
    if (!isTyping) {
      setStreamTypedText('');
      return;
    }

    const target = streamingView?.resultText ?? '';
    if (!target) return;

    if (streamTypedText.length > target.length) {
      setStreamTypedText(target);
      return;
    }

    if (streamTypedText === target) return;

    const remaining = target.length - streamTypedText.length;
    const step = Math.max(1, Math.ceil(remaining / 24));

    const timer = window.setTimeout(() => {
      setStreamTypedText(target.slice(0, streamTypedText.length + step));
    }, 18);

    return () => window.clearTimeout(timer);
  }, [isTyping, streamingView?.resultText, streamTypedText]);

  const triggerDownload = async (url: string) => {
    const token = localStorage.getItem('token');
    const candidates = buildDownloadCandidates(url);

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!response.ok) {
          continue;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const filename =
          getFilenameFromContentDisposition(response.headers.get('content-disposition')) ||
          'itinerary.pdf';

        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        return;
      } catch {
        // 继续尝试下一个候选地址
      }
    }

    // 保底：直接打开后端返回地址，便于排查
    window.open(candidates[0] || url, '_blank', 'noopener,noreferrer');
  };

  const fetchArtifactText = async (url: string): Promise<string | null> => {
    const token = localStorage.getItem('token');
    const candidates = buildDownloadCandidates(url);

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          continue;
        }
        const text = await response.text();
        if (text && text.trim()) {
          return text.trim();
        }
      } catch {
        // ignore and try next candidate
      }
    }

    return null;
  };

  const handleSend = async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed || isTyping) return;

    const manusRequest = buildManusPrompt(trimmed);

    const userMessage: AgentMessage = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setStreamingView(null);
    setStreamTypedText('');
    setStreamReasoningExpanded(true);

    let streamEntries: string[] = [];

    try {
      await sendManusMessageStream(
        manusRequest.prompt,
        (chunk) => {
          const entries = splitSsePayloadEntries(chunk);
          if (entries.length === 0) return;

          streamEntries = [...streamEntries, ...entries];
          setStreamingView(buildStructuredView(streamEntries, false));
        },
        () => {
          void (async () => {
            try {
              const structured = buildStructuredView(streamEntries, true);
              const mergedTrace = structured.rawTrace.join('\n').trim();
              const pdfArtifact = structured.artifacts.find((item) => item.downloadUrl && isPdfArtifact(item));
              const txtArtifact = structured.artifacts.find((item) => item.downloadUrl && isTxtArtifact(item));

              const txtContent = txtArtifact?.downloadUrl
                ? await fetchArtifactText(txtArtifact.downloadUrl)
                : null;

              const safeTxt = txtContent?.trim() || '';
              const safeStructuredText = structured.resultText?.trim() || '';
              const pdfUrls = pdfArtifact?.downloadUrl ? [normalizeDownloadUrl(pdfArtifact.downloadUrl)] : [];

              let content =
                safeTxt ||
                safeStructuredText ||
                mergedTrace ||
                '任务已完成，但未返回有效文本。';

              if (manusRequest.forcedPdf && pdfUrls.length === 0) {
                content = `${content}\n\n说明：本次未成功生成 PDF 文件，请重试一次或在输入中显式加上“生成PDF”。`;
              }

              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content,
                  pdfUrls,
                  structured,
                  timestamp: new Date().toISOString(),
                },
              ]);

              if (pdfUrls.length > 0) {
                void triggerDownload(pdfUrls[0]);
              }
            } catch (e) {
              console.error('整理智能体结果失败:', e);
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: '任务已结束，但结果整理失败，请重试。',
                  timestamp: new Date().toISOString(),
                },
              ]);
            } finally {
              setStreamingView(null);
              setStreamTypedText('');
              setIsTyping(false);
            }
          })();
        },
        (error) => {
          console.error('智能体调用失败:', error);
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: '智能体执行失败，请稍后重试。',
              timestamp: new Date().toISOString(),
            },
          ]);
          setStreamingView(null);
          setStreamTypedText('');
          setIsTyping(false);
        }
      );
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '发送失败，请检查网络后重试。',
          timestamp: new Date().toISOString(),
        },
      ]);
      setStreamingView(null);
      setStreamTypedText('');
      setIsTyping(false);
    }
  };

  const handleNewTask = () => {
    const nextSession = createAgentSession();
    setSessions((prev) => upsertSession(prev, nextSession));
    setActiveSessionId(nextSession.id);
    setMessages(nextSession.messages);
    setInputMessage('');
    setStreamingView(null);
    setStreamTypedText('');
    setIsTyping(false);
    setShowMenu(false);
  };

  const handleClearCurrent = () => {
    setMessages([createAgentWelcomeMessage()]);
    setInputMessage('');
    setStreamingView(null);
    setStreamTypedText('');
    setIsTyping(false);
    setShowMenu(false);
  };

  const handleSwitchSession = (sessionId: string) => {
    if (isTyping) return;
    setActiveSessionId(sessionId);
    setInputMessage('');
    setStreamingView(null);
    setStreamTypedText('');
    setShowMenu(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    if (isTyping) return;

    const rest = removeSession(sessions, sessionId);
    if (rest.length === 0) {
      const next = createAgentSession();
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
    setStreamingView(null);
    setStreamTypedText('');
    setShowMenu(false);
  };

  const handleOpenSaveSheet = (msg: AgentMessage, index: number) => {
    const state = buildSaveSheetState(msg, index);
    const destination = state.destination || inferDestinationFromTitle(state.title) || '待确认目的地';
    const title = state.title === '我的AI行程' ? `${destination}行程` : state.title;
    setSaveSheet({
      ...state,
      destination,
      title,
    });
    setSaveSheetError('');
  };

  const handleSubmitSaveSheet = async (event: FormEvent) => {
    event.preventDefault();
    if (!saveSheet) return;

    const startDate = normalizeDateInput(saveSheet.startDate);
    const endDate = normalizeDateInput(saveSheet.endDate);

    const resolvedDestination =
      saveSheet.destination.trim() || inferDestinationFromTitle(saveSheet.title) || '待确认目的地';
    const resolvedTitle = saveSheet.title.trim() || `${resolvedDestination}行程`;
    if (!startDate || !endDate) {
      setSaveSheetError('日期格式不正确，请使用 YYYY-MM-DD');
      return;
    }
    if (startDate > endDate) {
      setSaveSheetError('开始日期不能晚于结束日期');
      return;
    }
    if (!Number.isFinite(saveSheet.travelers) || saveSheet.travelers < 1) {
      setSaveSheetError('出行人数必须大于等于1');
      return;
    }

    setSavingMessageKey(saveSheet.messageKey);
    setSaveSheetError('');

    try {
      await createItineraryFromAi({
        aiContent: saveSheet.aiContent,
        pdfUrl: saveSheet.pdfUrl,
        title: resolvedTitle,
        destination: resolvedDestination,
        startDate,
        endDate,
        travelers: saveSheet.travelers,
      });
      setSaveSheet(null);
      navigate('/itinerary');
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试';
      setSaveSheetError(message);
    } finally {
      setSavingMessageKey(null);
    }
  };

  const statusText = isTyping ? '智能体正在执行任务...' : '可生成行程并返回 PDF';

  const toggleReasoning = (messageKey: string) => {
    setExpandedReasoningMap((prev) => ({
      ...prev,
      [messageKey]: !(prev[messageKey] ?? true),
    }));
  };

  return (
    <main className="flex flex-col h-screen bg-surface text-on-surface font-body relative overflow-x-hidden">
      <header className="flex justify-between items-center px-4 py-4 bg-surface/90 backdrop-blur-md z-30 sticky top-0 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm relative">
              <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-fixed rounded-full border-2 border-surface"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline leading-none text-on-surface">AI助手·智能体</h1>
              <span className={`text-xs font-medium ${isTyping ? 'text-primary' : 'text-on-surface-variant'}`}>{statusText}</span>
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
            <div className="absolute top-12 right-0 w-44 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-low overflow-hidden z-50">
              <button
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-on-surface flex items-center gap-2"
                onClick={handleNewTask}
              >
                <span className="material-symbols-outlined text-[18px]">add_comment</span>
                新建任务
              </button>
              <button
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-error flex items-center gap-2 border-t border-surface-container-low"
                onClick={handleClearCurrent}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                清空记录
              </button>

              {sessions.length > 0 && (
                <div className="border-t border-surface-container-low">
                  <p className="px-4 py-2 text-[11px] text-on-surface-variant font-semibold">历史任务</p>
                  <div className="max-h-56 overflow-y-auto">
                    {sessions.slice(0, 10).map((session) => (
                      <div key={session.id} className="flex items-center">
                        <button
                          className={`flex-1 px-4 py-2.5 text-left text-xs truncate transition-colors ${
                            session.id === activeSessionId ? 'bg-primary-container/40 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-low'
                          }`}
                          onClick={() => handleSwitchSession(session.id)}
                        >
                          {session.title || '未命名任务'}
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
          to="/chat"
          className="inline-flex items-center gap-1 rounded-full bg-primary-container/40 text-primary text-xs font-semibold px-3 py-1.5"
        >
          <span className="material-symbols-outlined text-[14px]">forum</span>
          切换到智能对话模式
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 flex flex-col pb-36">
        <div className="text-center">
          <span className="bg-surface-container-low text-on-surface-variant text-[11px] px-3 py-1 rounded-full font-medium">
            {new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {messages.map((msg, index) => (
          <div key={`${msg.timestamp}-${index}`} className={`flex gap-3 max-w-[90%] min-w-0 ${msg.role === 'user' ? 'self-end flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 overflow-hidden">
              {msg.role === 'assistant' ? (
                <div className="w-full h-full bg-primary flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    psychology
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

            <div className="flex flex-col gap-2 min-w-0 w-full">
              {msg.role === 'assistant' && msg.structured ? (
                <>
                  <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm p-3.5 shadow-sm border border-surface-container">
                    <button
                      className="w-full flex items-center justify-between text-left cursor-pointer"
                      onClick={() => toggleReasoning(`${msg.timestamp}-${index}`)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary">neurology</span>
                        <div>
                          <p className="text-xs font-semibold text-on-surface">深度思考</p>
                          <p className="text-[11px] text-on-surface-variant">
                            已完成 {msg.structured.reasoningSteps.length || msg.structured.toolCalls.length} 步分析
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-primary">
                        {(expandedReasoningMap[`${msg.timestamp}-${index}`] ?? true) ? '收起' : '展开'}
                      </span>
                    </button>

                    {(expandedReasoningMap[`${msg.timestamp}-${index}`] ?? true) && (
                      <div className="mt-3 pt-3 border-t border-surface-container space-y-3">
                        {/* 修复 O23：跳转到完整过程回溯页（含未摘要的原始 trace） */}
                        {msg.structured.runId && (
                          <button
                            type="button"
                            onClick={() => navigate(`/trace?runId=${encodeURIComponent(String(msg.structured?.runId))}`)}
                            className="w-full text-left text-[11px] font-semibold text-primary hover:underline"
                          >
                            查看完整过程（含未摘要的原始 trace）→
                          </button>
                        )}
                        {msg.structured.reasoningSteps.length > 0 && (
                          <section>
                            <p className="text-[11px] font-semibold text-on-surface-variant mb-2">思考路径</p>
                            <div className="space-y-2">
                              {msg.structured.reasoningSteps.map((step, stepIndex) => (
                                <div key={`${msg.timestamp}-reasoning-${stepIndex}`} className="flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-primary/12 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5 shrink-0">
                                    {stepIndex + 1}
                                  </span>
                                  <p className="text-xs text-on-surface-variant break-all">{step}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}

                        {msg.structured.toolCalls.length > 0 && (
                          <section>
                            <p className="text-[11px] font-semibold text-on-surface-variant mb-2">工具调用</p>
                            <div className="space-y-1.5">
                              {msg.structured.toolCalls.map((call, callIndex) => (
                                <div key={`${msg.timestamp}-tool-${callIndex}`} className="text-xs text-on-surface break-all">
                                  <span className="font-semibold">{call.step}</span>
                                  {' · '}
                                  <span className="font-semibold text-primary">{call.tool}</span>
                                  {call.output ? ` · ${shortenText(call.output, 96)}` : ''}
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed shadow-sm border border-surface-container">
                    <p className="text-[11px] font-semibold text-on-surface-variant mb-2">最终答复</p>
                    <TypewriterText text={msg.content?.trim() || '任务已完成，但未返回可展示的文本。'} className="whitespace-pre-wrap break-all" />
                  </div>
                </>
              ) : (
                <div
                  className={`${
                    msg.role === 'assistant'
                      ? 'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm'
                      : 'bg-primary text-white rounded-2xl rounded-tr-sm'
                  } p-4 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-all`}
                >
                  {msg.content}
                </div>
              )}

              {msg.role === 'assistant' && msg.pdfUrls && msg.pdfUrls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <a
                    href={msg.pdfUrls[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">picture_as_pdf</span>
                    下载PDF
                  </a>
                  <button
                    className="inline-flex items-center gap-1 border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors bg-surface cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => handleOpenSaveSheet(msg, index)}
                    disabled={savingMessageKey === `${msg.timestamp}-${index}`}
                  >
                    <span className="material-symbols-outlined text-[14px]">event_note</span>
                    {savingMessageKey === `${msg.timestamp}-${index}` ? '保存中...' : '保存到我的行程'}
                  </button>
                </div>
              )}

              {msg.role === 'assistant' && index === 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    className="border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors active:scale-95 bg-surface cursor-pointer"
                    onClick={() => setInputMessage('请帮我规划北京三日亲子游，并生成可下载的 PDF 行程单。')}
                  >
                    生成北京亲子游PDF
                  </button>
                  <button
                    className="border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors active:scale-95 bg-surface cursor-pointer"
                    onClick={() => setInputMessage('帮我做上海两天美食路线，输出 PDF 版。')}
                  >
                    生成上海美食行程PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[90%] min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                psychology
              </span>
            </div>
            <div className="bg-surface-container-low text-on-surface p-3.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm min-h-[3rem] w-full min-w-0 border border-surface-container overflow-x-hidden">
              {streamingView ? (
                <>
                  <button
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => setStreamReasoningExpanded((prev) => !prev)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary animate-pulse">neurology</span>
                      <div>
                        <p className="text-xs font-semibold text-on-surface">深度思考中...</p>
                        <p className="text-[11px] text-on-surface-variant">
                          已分析 {streamingView.reasoningSteps.length || streamingView.toolCalls.length} 步
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-primary">{streamReasoningExpanded ? '收起' : '展开'}</span>
                  </button>

                  {streamReasoningExpanded && (
                    <div className="mt-3 pt-3 border-t border-surface-container space-y-3">
                      {streamingView.reasoningSteps.length > 0 && (
                        <section>
                          <p className="text-[11px] font-semibold text-on-surface-variant mb-2">思考路径</p>
                          <div className="space-y-2">
                            {streamingView.reasoningSteps.map((step, index) => (
                              <div key={`stream-reasoning-${index}`} className="flex items-start gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary/12 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5 shrink-0">
                                  {index + 1}
                                </span>
                                <p className="text-xs text-on-surface-variant break-all">{step}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {streamingView.toolCalls.length > 0 && (
                        <section>
                          <p className="text-[11px] font-semibold text-on-surface-variant mb-2">工具调用</p>
                          <div className="space-y-1.5">
                            {streamingView.toolCalls.map((call, index) => (
                              <div key={`stream-tool-${index}`} className="text-xs text-on-surface break-all">
                                <span className="font-semibold">{call.step}</span>
                                {' · '}
                                <span className="font-semibold text-primary">{call.tool}</span>
                                {call.output ? ` · ${shortenText(call.output, 96)}` : ''}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  <section className="mt-3 pt-3 border-t border-surface-container">
                    <p className="text-[11px] font-semibold text-on-surface-variant mb-2">当前答复</p>
                    <p className="whitespace-pre-wrap break-all">{streamTypedText || '正在汇总结果...'}</p>
                  </section>
                </>
              ) : (
                <p className="whitespace-pre-wrap">正在规划任务...</p>
              )}
              <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-pulse"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="bg-surface/80 backdrop-blur-xl border-t border-surface-container px-4 py-3 fixed bottom-0 w-full z-40 pb-safe">
        <div className="flex items-center gap-2 bg-surface-container-low rounded-[1.5rem] p-2 focus-within:ring-2 ring-primary/30 transition-shadow">
          <button className="w-10 h-10 flex flex-shrink-0 items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full active:scale-95 cursor-pointer">
            <span className="material-symbols-outlined">add_task</span>
          </button>

          <textarea
            className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] py-2 text-sm leading-6 font-medium text-on-surface placeholder:text-on-surface-variant/70 no-scrollbar"
            placeholder="描述任务，例如：规划路线并输出PDF"
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isTyping}
          />

          <button
            className="w-10 h-10 flex flex-shrink-0 items-center justify-center bg-primary rounded-full text-white shadow-md active:scale-90 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSend}
            disabled={isTyping || !inputMessage.trim()}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              arrow_upward
            </span>
          </button>
        </div>
      </div>

      {saveSheet && (
        <div className="fixed inset-0 z-[70] bg-black/45 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-surface rounded-2xl border border-surface-container shadow-xl">
            <form onSubmit={handleSubmitSaveSheet}>
              <div className="px-5 py-4 border-b border-surface-container flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-on-surface">保存到我的行程</h2>
                  <p className="text-xs text-on-surface-variant mt-1">将根据 AI 生成文档自动创建对应行程，仅需确认基础信息</p>
                </div>
                <button
                  type="button"
                  className="w-8 h-8 rounded-full hover:bg-surface-container-low text-on-surface-variant"
                  onClick={() => setSaveSheet(null)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="p-5 space-y-5">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-xs text-on-surface-variant font-semibold">
                    行程标题
                    <input
                      className="mt-1 w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm"
                      value={saveSheet.title}
                      onChange={(e) => setSaveSheet((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                    />
                  </label>
                  <label className="text-xs text-on-surface-variant font-semibold">
                    目的地
                    <input
                      className="mt-1 w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm"
                      value={saveSheet.destination}
                      onChange={(e) => setSaveSheet((prev) => (prev ? { ...prev, destination: e.target.value } : prev))}
                    />
                  </label>
                  <label className="text-xs text-on-surface-variant font-semibold">
                    开始日期
                    <input
                      className="mt-1 w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm"
                      value={saveSheet.startDate}
                      onChange={(e) => setSaveSheet((prev) => (prev ? { ...prev, startDate: e.target.value } : prev))}
                      placeholder="YYYY-MM-DD"
                    />
                  </label>
                  <label className="text-xs text-on-surface-variant font-semibold">
                    结束日期
                    <input
                      className="mt-1 w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm"
                      value={saveSheet.endDate}
                      onChange={(e) => setSaveSheet((prev) => (prev ? { ...prev, endDate: e.target.value } : prev))}
                      placeholder="YYYY-MM-DD"
                    />
                  </label>
                  <label className="text-xs text-on-surface-variant font-semibold md:col-span-2">
                    出行人数
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-lg border border-surface-container-low bg-surface-container-lowest px-3 py-2 text-sm"
                      value={saveSheet.travelers}
                      onChange={(e) =>
                        setSaveSheet((prev) =>
                          prev ? { ...prev, travelers: Number(e.target.value || 1) } : prev
                        )
                      }
                    />
                  </label>
                </section>

                {saveSheetError && <p className="text-sm text-error">{saveSheetError}</p>}
              </div>

              <div className="px-5 py-4 border-t border-surface-container flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-surface-container-low"
                  onClick={() => setSaveSheet(null)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingMessageKey === saveSheet.messageKey}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white disabled:opacity-60"
                >
                  {savingMessageKey === saveSheet.messageKey ? '保存中...' : '确认保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
