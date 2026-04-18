import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getFeaturedDestinations,
    getHotRecommendations,
    getNotificationList,
    markNotificationRead,
    type Destination,
    type Recommendation,
    type Notification
} from '../services';

export default function Home() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [destinations, setDestinations] = useState<Destination[]>([]);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // 加载数据
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 并行加载所有数据
                const [destData, recData, notifData] = await Promise.all([
                    getFeaturedDestinations(10).catch(() => []),
                    getHotRecommendations(1, 10).catch(() => ({ list: [], total: 0, page: 1, size: 10 })),
                    getNotificationList(false, 1, 20).catch(() => ({ list: [], unreadCount: 0, total: 0 }))
                ]);

                setDestinations(destData);
                setRecommendations(recData.list);
                setNotifications(notifData.list);
                setUnreadCount(notifData.unreadCount);
            } catch (error) {
                console.error('加载数据失败:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // 标记全部已读
    const handleMarkAllRead = async () => {
        try {
            await markNotificationRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('标记已读失败:', error);
        }
    };

    return (
        <main className="text-on-surface bg-surface min-h-screen pb-32">
            {/* TopAppBar */}
            <header className="fixed top-0 w-full z-40 bg-[#f7f5ff]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
                <div className="flex items-center gap-3 active:scale-95 transition-transform">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-surface-container">
                        <img
                            className="w-full h-full object-cover"
                            alt="Profile"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNrwIUsVv00-3TzaxasKMLadmcPhK1MtWRH1WeKvCKQLd66E3LELr5sOiJpDCWtI1U_XVTk7NY690JjkelfF3WwHpyOYpaGSHf7cb5tjL0r-M8Lv1ocNJHtcKmBaUN-4r2oeHVmo0BmdDUZdDdYGqsbcVsHyU1CBHAj4rgxNsSpBUYq6f_gaa0m1WTHeDcAf3YZrYoQmvE34x_bXpZbb6pedKao0HO7WY5mOHNA5-hSgDaHrKVE0vO6gOJ6qGtOVaQ1v9SlJzm7ko"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    <span className="text-[#232c51] font-black text-xl font-headline tracking-wider">发现灵感</span>
                </div>
                <div className="flex items-center gap-4 relative">
                    <button
                        className="text-[#515981] hover:bg-black/5 p-2 rounded-full transition-colors active:scale-95 relative"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        {unreadCount > 0 && (
                            <span className="material-symbols-outlined absolute top-2 right-2 text-error text-[10px] bg-error rounded-full ring-2 ring-[#f7f5ff]"></span>
                        )}
                        <span className="material-symbols-outlined">notifications</span>
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-64 bg-surface rounded-2xl shadow-xl border border-surface-container-low overflow-hidden z-50">
                            <div className="p-4 border-b border-surface-container-low flex justify-between items-center bg-surface-container-lowest">
                                <span className="font-bold text-sm">系统消息 {unreadCount > 0 && `(${unreadCount})`}</span>
                                <button
                                    className="text-xs text-primary font-medium"
                                    onClick={handleMarkAllRead}
                                >
                                    全部已读
                                </button>
                            </div>
                            <div className="max-h-64 overflow-y-auto no-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-on-surface-variant">暂无通知</div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className="p-3 border-b border-surface-container-lowest hover:bg-surface-container-lowest transition-colors cursor-pointer"
                                            style={{ opacity: notif.isRead ? 0.6 : 1 }}
                                        >
                                            <p className="text-sm font-bold text-on-surface mb-1">{notif.title}</p>
                                            <p className="text-xs text-on-surface-variant line-clamp-2">{notif.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="pt-24 px-6 max-w-5xl mx-auto space-y-10">
                {/* Animated Search Bar */}
                <section className="relative group">
                    <div className="flex items-center bg-surface-container-low rounded-full px-6 py-4 transition-all duration-300 group-focus-within:bg-surface-container-lowest group-focus-within:shadow-xl group-focus-within:ring-2 group-focus-within:ring-primary/20">
                        <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
                        <input
                            className="bg-transparent border-none outline-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant font-medium"
                            placeholder="搜索目的地或灵感"
                            type="text"
                        />
                        <span className="material-symbols-outlined text-primary ml-2">tune</span>
                    </div>
                </section>

                {/* Dynamic Category Bento */}
                <section className="grid grid-cols-4 gap-4">
                    <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                            <span className="material-symbols-outlined text-2xl">flight</span>
                        </div>
                        <span className="text-sm font-semibold text-on-surface-variant">机票</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300">
                            <span className="material-symbols-outlined text-2xl">hotel</span>
                        </div>
                        <span className="text-sm font-semibold text-on-surface-variant">酒店</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-all duration-300">
                            <span className="material-symbols-outlined text-2xl">attractions</span>
                        </div>
                        <span className="text-sm font-semibold text-on-surface-variant">景点</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
                        <div className="w-14 h-14 rounded-2xl bg-surface-variant/40 flex items-center justify-center text-on-surface-variant group-hover:bg-on-surface group-hover:text-surface transition-all duration-300">
                            <span className="material-symbols-outlined text-2xl">map</span>
                        </div>
                        <span className="text-sm font-semibold text-on-surface-variant">攻略</span>
                    </div>
                </section>

                {/* Featured Carousel - 使用API数据 */}
                <section className="space-y-4 overflow-hidden -mx-6 px-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-extrabold text-on-surface font-headline chinese-header">本周精选目的地</h2>
                        <button className="text-primary font-semibold text-sm hover:underline">查看全部</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 pr-12 snap-x">
                        {loading ? (
                            <div className="text-on-surface-variant">加载中...</div>
                        ) : destinations.length > 0 ? (
                            destinations.map((dest, index) => (
                                <Link
                                    key={dest.id}
                                    to={`/detail?id=${dest.id}`}
                                    className={`flex-shrink-0 ${index === 0 ? 'w-80 h-[420px]' : 'w-64 h-[420px]'} ${index === 1 ? 'mt-8' : ''} relative rounded-[2rem] overflow-hidden group shadow-lg cursor-pointer snap-center active:scale-[0.98] transition-transform`}
                                >
                                    <img
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        alt={dest.name}
                                        src={dest.imageUrl}
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-0 left-0 p-6 w-full">
                                        <span className={`bg-${dest.tagColor}-container text-on-${dest.tagColor}-container px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block`}>
                                            {dest.tag}
                                        </span>
                                        <h3 className={`text-white ${index === 0 ? 'text-3xl' : 'text-2xl'} font-black mb-1`}>
                                            {dest.name}, {dest.country}
                                        </h3>
                                        <p className="text-white/80 text-sm font-medium">{dest.description}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-on-surface-variant">暂无数据</div>
                        )}
                    </div>
                </section>

                {/* Personalized Recommendations - 使用API数据 */}
                <section className="space-y-6">
                    <h2 className="text-2xl font-extrabold text-on-surface font-headline chinese-header">热门推荐</h2>
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-on-surface-variant">加载中...</div>
                        ) : recommendations.length > 0 ? (
                            recommendations.map((rec) => (
                                <Link
                                    key={rec.id}
                                    to={`/detail?id=${rec.id}&type=recommendation`}
                                    className="flex gap-4 p-4 bg-surface-container-low rounded-[1.5rem] hover:bg-surface-container-lowest transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
                                >
                                    <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                                        <img
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            alt={rec.title}
                                            src={rec.imageUrl}
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                {rec.tags.map((tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-secondary-fixed text-on-secondary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <h4 className="font-bold text-lg text-on-surface">{rec.title}</h4>
                                            <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">{rec.description}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-primary font-black text-lg">
                                                ¥{rec.price.toLocaleString()} <span className="text-xs font-medium text-on-surface-variant">起</span>
                                            </span>
                                            <div className="flex items-center text-xs text-on-surface-variant font-medium">
                                                <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                                                    star
                                                </span>
                                                {rec.rating} ({rec.reviewCount.toLocaleString()} 评价)
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="text-on-surface-variant">暂无推荐</div>
                        )}
                    </div>
                </section>
            </div>

            {/* FAB for AI Chat */}
            <Link
                to="/chat"
                className="fixed right-6 bottom-28 w-16 h-16 bg-primary rounded-full shadow-[0_12px_32px_rgba(35,44,81,0.2)] flex items-center justify-center text-white active:scale-90 transition-transform z-30"
            >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    smart_toy
                </span>
            </Link>
        </main>
    );
}
