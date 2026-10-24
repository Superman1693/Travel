// SSE 流式对话服务
import { API_BASE_URL } from '../utils/network';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                onComplete();
                break;
            }

            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const chunk = line.slice(5).trim();
                    if (chunk) {
                        onChunk(chunk);
                    }
                }
            }
        }
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let pending = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                const tail = pending.trim();
                if (tail.startsWith('data:')) {
                    const payload = tail.slice(5).trim();
                    if (payload) onChunk(payload);
                }
                onComplete();
                break;
            }

            pending += decoder.decode(value, { stream: true });
            const lines = pending.split(/\r?\n/);
            pending = lines.pop() ?? '';

            for (const line of lines) {
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload) continue;

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
            }
        }
    } catch (error) {
        onError(error as Error);
    }
};
