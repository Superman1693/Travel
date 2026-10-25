import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotificationList, markNotificationRead, type Notification } from '../services';

const PAGE_SIZE = 10;

const TYPE_META: Record<Notification['type'], { label: string; badgeClass: string }> = {
  order: { label: '订单', badgeClass: 'bg-primary-container/45 text-primary' },
  reminder: { label: '提醒', badgeClass: 'bg-tertiary-container/45 text-tertiary' },
  system: { label: '系统', badgeClass: 'bg-secondary-container/60 text-secondary' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id);

  // 竞态守卫：cleanup 置 cancelled，防止过期请求结果覆盖新数据（参照 Orders.tsx）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const result = await getNotificationList(false, 1, PAGE_SIZE);
        if (cancelled) return;
        const list = result.list || [];
        setNotifications(list);
        setHasMore(list.length >= PAGE_SIZE);
        setPage(1);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : '加载通知失败';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    if (loadingMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const result = await getNotificationList(false, nextPage, PAGE_SIZE);
      const list = result.list || [];
      setNotifications((prev) => [...prev, ...list]);
      setHasMore(list.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '加载通知失败';
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRead = async (item: Notification) => {
    if (item.isRead || markingId === item.id) return;
    try {
      setMarkingId(item.id);
      await markNotificationRead([item.id]);
      setNotifications((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, isRead: true } : it))
      );
    } catch (readError) {
      const message = readError instanceof Error ? readError.message : '标记已读失败';
      setError(message);
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadIds.length === 0 || markingAll) return;
    try {
      setMarkingAll(true);
      await markNotificationRead(unreadIds);
      const readIdSet = new Set(unreadIds);
      setNotifications((prev) =>
        prev.map((it) => (readIdSet.has(it.id) ? { ...it, isRead: true } : it))
      );
    } catch (readError) {
      const message = readError instanceof Error ? readError.message : '标记已读失败';
      setError(message);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold font-headline">消息通知</h1>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadIds.length === 0 || markingAll}
          className="text-sm font-semibold text-primary disabled:text-on-surface-variant/60 disabled:cursor-not-allowed"
        >
          {markingAll ? '处理中...' : '全部已读'}
        </button>
      </header>

      <section className="px-6 py-4">
        {loading && <p className="text-sm text-on-surface-variant">正在加载通知...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {!loading && !error && notifications.length === 0 && (
          <div className="rounded-2xl bg-surface-container-low p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">notifications_none</span>
            <p className="mt-3 text-base text-on-surface-variant">暂无消息通知</p>
            <p className="mt-1 text-sm text-on-surface-variant/70">有新动态时会第一时间告诉你</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <p className="text-xs text-on-surface-variant mb-3">
            {unreadIds.length > 0 ? `${unreadIds.length} 条未读` : '全部已读'}
          </p>
        )}

        <div className="space-y-4">
          {notifications.map((item) => {
            const meta = TYPE_META[item.type] ?? TYPE_META.system;
            return (
              <article
                key={item.id}
                onClick={() => handleRead(item)}
                className={`relative rounded-2xl p-4 pl-7 shadow-sm transition-colors ${
                  item.isRead ? 'bg-surface-container-low' : 'bg-primary-container/20'
                }`}
              >
                {!item.isRead && (
                  <span
                    aria-hidden="true"
                    className="absolute left-3 top-[1.4rem] w-2 h-2 rounded-full bg-primary"
                  />
                )}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-on-surface line-clamp-2">{item.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mt-1.5 whitespace-pre-wrap break-words">{item.content}</p>
                <p className="text-xs text-on-surface-variant/70 mt-2">
                  {new Date(item.createTime).toLocaleString('zh-CN')}
                  {markingId === item.id && <span className="ml-2">标记中...</span>}
                </p>
              </article>
            );
          })}
        </div>

        {hasMore && !loading && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors disabled:opacity-60"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
