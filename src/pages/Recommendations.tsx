import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getHotRecommendations, type Recommendation } from '../services';

export default function Recommendations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 10;

  const fetchRecommendations = async (pageNum: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
      }
      const data = await getHotRecommendations(pageNum, pageSize);
      const list = data.list || [];
      setRecommendations((prev) => (append ? [...prev, ...list] : list));
      setHasMore(list.length >= pageSize);
      setPage(pageNum);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取热门推荐失败';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(1, false);
  }, []);

  const cacheRecommendation = (item: Recommendation) => {
    sessionStorage.setItem(`travel.recommendation.${item.id}`, JSON.stringify(item));
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-black font-headline">热门推荐</h1>
        <div className="w-10 h-10" />
      </header>

      <section className="px-6 py-6 space-y-4">
        {loading && (
          <p className="text-sm text-on-surface-variant">正在加载热门推荐...</p>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
            <p className="text-error text-sm">{error}</p>
            <button
              type="button"
              onClick={() => fetchRecommendations(1, false)}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && recommendations.length === 0 && (
          <p className="text-sm text-on-surface-variant">暂无热门推荐</p>
        )}

        {recommendations.map((item) => (
          <Link
            key={item.id}
            to={`/detail?type=recommendation&id=${item.id}`}
            onClick={() => cacheRecommendation(item)}
            className="flex gap-4 p-4 bg-surface-container-low rounded-[1.5rem] shadow-[0_8px_24px_rgba(35,44,81,0.08)]"
          >
            <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0">
              <img
                className="w-full h-full object-cover"
                alt={item.title}
                src={item.imageUrl}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex gap-2 flex-wrap mb-2">
                {item.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="font-bold text-lg text-on-surface line-clamp-2">{item.title}</h2>
              <p className="text-sm text-on-surface-variant line-clamp-2 mt-1">{item.description}</p>
              <div className="flex justify-between items-center mt-3">
                <span className="text-primary font-black text-lg">
                  {item.dataSource === 'llm' ? '约 ' : ''}¥{item.price.toLocaleString()} <span className="text-xs font-medium text-on-surface-variant">起</span>
                </span>
                <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
                  {item.rating} ({item.reviewCount} 评价)
                </span>
              </div>
              {item.dataSource === 'llm' && (
                <p className="mt-2 text-[10px] text-on-surface-variant/80">AI 生成，仅供参考</p>
              )}
            </div>
          </Link>
        ))}

        {hasMore && !loading && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={() => fetchRecommendations(page + 1, true)}
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