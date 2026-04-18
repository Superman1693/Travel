/**
 * API 使用示例
 * 这个文件展示了如何在 React 组件中使用 API 服务
 */

import { useEffect, useState } from 'react';
import {
    // 用户相关
    login,
    register,
    getCurrentUser,
    updateUser,
    uploadAvatar,
    type User,

    // 目的地相关
    getFeaturedDestinations,
    getDestinationDetail,
    type Destination,

    // 推荐相关
    getHotRecommendations,
    type Recommendation,

    // 行程相关
    getItineraryList,
    getItineraryDetail,
    createItinerary,
    type Itinerary,

    // 通知相关
    getNotificationList,
    markNotificationRead,
    type Notification,

    // 订单相关
    getOrderList,
    createOrder,
    type Order,

    // 收藏相关
    getFavoriteList,
    addFavorite,
    removeFavorite,

    // 搜索
    search,

    // 聊天
    sendMessageStream,
} from '../services';

// 示例 1: 用户登录
export function LoginExample() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const result = await login({ username, password });
            localStorage.setItem('token', result.token);
            localStorage.setItem('userInfo', JSON.stringify(result.user));
            console.log('登录成功:', result.user);
        } catch (error) {
            console.error('登录失败:', error);
        }
    };

    return (
        <div>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="用户名" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码" type="password" />
            <button onClick={handleLogin}>登录</button>
        </div>
    );
}

// 示例 2: 获取精选目的地
export function FeaturedDestinationsExample() {
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const data = await getFeaturedDestinations(10);
                setDestinations(data);
            } catch (error) {
                console.error('获取目的地失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDestinations();
    }, []);

    if (loading) return <div>加载中...</div>;

    return (
        <div>
            {destinations.map((dest) => (
                <div key={dest.id}>
                    <h3>{dest.name}</h3>
                    <p>{dest.description}</p>
                    <img src={dest.imageUrl} alt={dest.name} />
                </div>
            ))}
        </div>
    );
}

// 示例 3: 获取热门推荐
export function HotRecommendationsExample() {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const result = await getHotRecommendations(1, 10);
                setRecommendations(result.list);
            } catch (error) {
                console.error('获取推荐失败:', error);
            }
        };

        fetchRecommendations();
    }, []);

    return (
        <div>
            {recommendations.map((rec) => (
                <div key={rec.id}>
                    <h3>{rec.title}</h3>
                    <p>{rec.description}</p>
                    <p>价格: ¥{rec.price}</p>
                    <p>评分: {rec.rating} ({rec.reviewCount} 评价)</p>
                </div>
            ))}
        </div>
    );
}

// 示例 4: 获取通知列表
export function NotificationsExample() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const result = await getNotificationList(false, 1, 20);
                setNotifications(result.list);
                setUnreadCount(result.unreadCount);
            } catch (error) {
                console.error('获取通知失败:', error);
            }
        };

        fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await markNotificationRead();
            setUnreadCount(0);
            console.log('已标记全部已读');
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    };

    return (
        <div>
            <h2>通知 ({unreadCount} 未读)</h2>
            <button onClick={handleMarkAllRead}>全部已读</button>
            {notifications.map((notif) => (
                <div key={notif.id} style={{ opacity: notif.isRead ? 0.5 : 1 }}>
                    <h4>{notif.title}</h4>
                    <p>{notif.content}</p>
                    <small>{notif.createTime}</small>
                </div>
            ))}
        </div>
    );
}

// 示例 5: AI 聊天（SSE 流式）
export function ChatExample() {
    const [message, setMessage] = useState('');
    const [aiReply, setAiReply] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        setIsTyping(true);
        setAiReply('');

        await sendMessageStream(
            message,
            'default',
            // onChunk: 每次收到新内容
            (chunk) => {
                setAiReply((prev) => prev + chunk);
            },
            // onComplete: 完成
            () => {
                setIsTyping(false);
                console.log('AI 回复完成');
            },
            // onError: 错误
            (error) => {
                setIsTyping(false);
                console.error('聊天错误:', error);
            }
        );

        setMessage('');
    };

    return (
        <div>
            <div>
                <p>AI: {aiReply}</p>
                {isTyping && <span>正在输入...</span>}
            </div>
            <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入消息"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button onClick={handleSendMessage} disabled={isTyping}>
                发送
            </button>
        </div>
    );
}

// 示例 6: 创建行程
export function CreateItineraryExample() {
    const handleCreateItinerary = async () => {
        try {
            const result = await createItinerary({
                title: '我的成都之行',
                startDate: '2026-04-20',
                endDate: '2026-04-24',
                travelers: 4,
                destination: '成都',
            });
            console.log('行程创建成功:', result);
        } catch (error) {
            console.error('创建行程失败:', error);
        }
    };

    return <button onClick={handleCreateItinerary}>创建行程</button>;
}

// 示例 7: 搜索
export function SearchExample() {
    const [keyword, setKeyword] = useState('');
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!keyword.trim()) return;

        try {
            const result = await search(keyword, 'all', 1, 10);
            setResults(result.list);
        } catch (error) {
            console.error('搜索失败:', error);
        }
    };

    return (
        <div>
            <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索目的地或灵感"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>搜索</button>
            <div>
                {results.map((item) => (
                    <div key={item.id}>
                        <h4>{item.name}</h4>
                        <p>{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 示例 8: 上传头像
export function UploadAvatarExample() {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const updatedUser = await uploadAvatar(file);
            console.log('头像上传成功:', updatedUser.avatarUrl);
            // 更新本地用户信息
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('上传头像失败:', error);
        }
    };

    return (
        <div>
            <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>
    );
}
