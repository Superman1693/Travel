import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendMessageStream } from '../services';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function Chat() {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '嗨！我是小灵，您的专属行程助理。您想去哪里旅行？或者需要我帮您规划成都的行程吗？',
            timestamp: new Date().toISOString(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentAiMessage, setCurrentAiMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatId = useRef(`chat-${Date.now()}`); // 生成唯一会话ID

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentAiMessage]);

    // 发送消息
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isTyping) return;

        const userMessage: Message = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');
        setIsTyping(true);
        setCurrentAiMessage('');

        try {
            await sendMessageStream(
                inputMessage,
                chatId.current,
                // onChunk: 每次收到新内容
                (chunk) => {
                    setCurrentAiMessage((prev) => prev + chunk);
                },
                // onComplete: 完成
                () => {
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: currentAiMessage,
                            timestamp: new Date().toISOString(),
                        },
                    ]);
                    setCurrentAiMessage('');
                    setIsTyping(false);
                },
                // onError: 错误
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
            setIsTyping(false);
        }
    };

    // 新建对话
    const handleNewChat = () => {
        chatId.current = `chat-${Date.now()}`;
        setMessages([
            {
                role: 'assistant',
                content: '嗨！我是小灵，您的专属行程助理。您想去哪里旅行？或者需要我帮您规划成都的行程吗？',
                timestamp: new Date().toISOString(),
            },
        ]);
        setShowMenu(false);
    };

    // 快捷回复
    const handleQuickReply = (text: string) => {
        setInputMessage(text);
    };

    return (
        <main className="flex flex-col h-screen bg-surface text-on-surface font-body relative">
            {/* TopAppBar */}
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
                                smart_toy
                            </span>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-fixed rounded-full border-2 border-surface"></div>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold font-headline leading-none text-on-surface">小灵</h1>
                            <span className="text-xs text-on-surface-variant font-medium">您的智能行程助理</span>
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

                    {/* Dropdown Menu */}
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
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-on-surface flex items-center gap-2 border-t border-surface-container-low"
                                onClick={() => setShowMenu(false)}
                            >
                                <span className="material-symbols-outlined text-[18px]">history</span>
                                查看历史对话
                            </button>
                            <button
                                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-error flex items-center gap-2 border-t border-surface-container-low"
                                onClick={() => {
                                    handleNewChat();
                                    setShowMenu(false);
                                }}
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                删除对话
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 flex flex-col pb-36">
                {/* System Time */}
                <div className="text-center">
                    <span className="bg-surface-container-low text-on-surface-variant text-[11px] px-3 py-1 rounded-full font-medium">
                        {new Date().toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Messages */}
                {messages.map((msg, index) => (
                    <div
                        key={index}
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
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNrwIUsVv00-3TzaxasKMLadmcPhK1MtWRH1WeKvCKQLd66E3LELr5sOiJpDCWtI1U_XVTk7NY690JjkelfF3WwHpyOYpaGSHf7cb5tjL0r-M8Lv1ocNJHtcKmBaUN-4r2oeHVmo0BmdDUZdDdYGqsbcVsHyU1CBHAj4rgxNsSpBUYq6f_gaa0m1WTHeDcAf3YZrYoQmvE34x_bXpZbb6pedKao0HO7WY5mOHNA5-hSgDaHrKVE0vO6gOJ6qGtOVaQ1v9SlJzm7ko"
                                    referrerPolicy="no-referrer"
                                />
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div
                                className={`${msg.role === 'assistant'
                                        ? 'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm'
                                        : 'bg-primary text-white rounded-2xl rounded-tr-sm'
                                    } p-4 text-sm leading-relaxed shadow-sm`}
                            >
                                {msg.content}
                            </div>
                            {/* 快捷回复建议 - 仅第一条消息显示 */}
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

                {/* 正在输入的AI消息 */}
                {isTyping && currentAiMessage && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                smart_toy
                            </span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm relative min-h-[3rem]">
                                {currentAiMessage}
                                <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 正在输入指示器 */}
                {isTyping && !currentAiMessage && (
                    <div className="flex gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
                            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                smart_toy
                            </span>
                        </div>
                        <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-surface/80 backdrop-blur-xl border-t border-surface-container px-4 py-3 fixed bottom-0 w-full z-40 pb-safe">
                <div className="flex items-end gap-2 bg-surface-container-low rounded-[1.5rem] p-2 focus-within:ring-2 ring-primary/30 transition-shadow">
                    <button className="w-10 h-10 flex flex-shrink-0 items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full active:scale-95 cursor-pointer">
                        <span className="material-symbols-outlined">add_circle</span>
                    </button>
                    <textarea
                        className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[40px] py-2.5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/70 no-scrollbar self-center"
                        placeholder="输入您想去的地方或需求..."
                        rows={1}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        disabled={isTyping}
                    />
                    <button
                        className="w-10 h-10 flex flex-shrink-0 items-center justify-center bg-primary rounded-full text-white shadow-md active:scale-90 transition-transform mb-0.5 self-end cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
