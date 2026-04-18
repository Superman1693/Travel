// SSE 流式对话服务

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
    const url = `http://localhost:8123/api/ai/travel_app/chat/sse-emitter?${params}`;

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
    const url = `http://localhost:8123/api/ai/travel_app/chat/sync?${params}`;

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
