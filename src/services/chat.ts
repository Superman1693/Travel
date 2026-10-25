// SSE 流式对话服务
import { API_BASE_URL } from '../utils/network';
import { clearAuthState, redirectToLoginForUnauthorized } from '../utils/auth';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

// SSE 流式读取通用工具：跨 chunk 缓冲、按行切分（兼容 \r\n）、结束时 flush 剩余（含无换行尾巴）
const readSseLines = async (response: Response, onLine: (line: string) => void): Promise<void> => {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let pending = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            // flush 缓冲区剩余内容，避免无换行尾巴丢失
            if (pending) {
                onLine(pending);
            }
            return;
        }

        pending += decoder.decode(value, { stream: true });
        const lines = pending.split(/\r?\n/);
        // 最后一段可能是半包，回填 pending 等下一个 chunk 拼接
        pending = lines.pop() ?? '';

        for (const line of lines) {
            onLine(line);
        }
    }
};

// SSE 401 统一处理：清除本地登录态并跳转登录页（与 api.ts 行为一致），调用方应中止读取
const handleUnauthorized = (): void => {
    clearAuthState();
    redirectToLoginForUnauthorized();
};

// SSE 流式对话（推荐使用）
export const sendMessageStream = async (
    message: string,
    chatId: string = 'default',
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
): Promise<void> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ message, chatId });
    const url = `${API_BASE_URL}/ai/travel_app/chat/sse-emitter?${params}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await readSseLines(response, (line) => {
            if (!line.startsWith('data:')) {
                return;
            }
            const chunk = line.slice(5).trim();
            if (chunk) {
                onChunk(chunk);
            }
        });

        onComplete();
    } catch (error) {
        onError(error as Error);
    }
};

// RAG 知识问答流式对话：与 sendMessageStream 消费方式一致（data 行为纯文本增量），仅 URL 不同
export const sendRagMessageStream = async (
    message: string,
    chatId: string = 'default',
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
): Promise<void> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ message, chatId });
    const url = `${API_BASE_URL}/ai/rag/chat?${params}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await readSseLines(response, (line) => {
            if (!line.startsWith('data:')) {
                return;
            }
            const chunk = line.slice(5).trim();
            if (chunk) {
                onChunk(chunk);
            }
        });

        onComplete();
    } catch (error) {
        onError(error as Error);
    }
};

// 同步对话（备用）
export const sendMessageSync = async (
    message: string,
    chatId: string = 'default'
): Promise<string> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ message, chatId });
    const url = `${API_BASE_URL}/ai/travel_app/chat/sync?${params}`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (result.code !== 0) {
        throw new Error(result.description || result.message);
    }

    return result.data;
};

// Manus 智能体流式对话
export const sendManusMessageStream = async (
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
): Promise<void> => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ message });
    const url = `${API_BASE_URL}/ai/manus/chat?${params}`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            handleUnauthorized();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        await readSseLines(response, (line) => {
            if (!line.startsWith('data:')) return;
            const payload = line.slice(5).trim();
            if (!payload) return;

            if (payload.startsWith('{')) {
                try {
                    const parsed = JSON.parse(payload);
                    const chunk = typeof parsed.data === 'string' ? parsed.data : payload;
                    if (chunk) onChunk(chunk);
                } catch {
                    onChunk(payload);
                }
            } else {
                onChunk(payload);
            }
        });

        onComplete();
    } catch (error) {
        onError(error as Error);
    }
};
