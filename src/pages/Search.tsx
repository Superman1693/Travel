import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { search, type SearchResult } from '../services/search';

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(keyword);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const pageSize = 10;

  const cacheRecommendation = (item: SearchResult) => {
    sessionStorage.setItem(
      `travel.recommendation.${item.id}`,
      JSON.stringify({
        id: item.id,
        title: item.name,
        description: item.description,
        imageUrl: item.imageUrl,
        price: item.price || 0,
        rating: 0,
        reviewCount: 0,
        tags: [],
      }),
    );
  };

  const executeSearch = useCallback(
    async (kw: string, pageNum: number, append: boolean) => {
      if (!kw.trim()) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setResults([]);
      }
      setError('');

      try {
        const data = await search(kw, 'all', pageNum, pageSize);
        const list = data.list || [];
        setResults((prev) => (append ? [...prev, ...list] : list));
        setTotal(data.total || 0);
        setHasMore(list.length >= pageSize);
        setPage(pageNum);
      } catch (err) {
        const message = err instanceof Error ? err.message : '搜索失败，请稍后重试';
        setError(message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    if (keyword) {
      setInputValue(keyword);
      executeSearch(keyword, 1, false);
    }
  }, [keyword, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setSearchParams({ q: trimmed });
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    executeSearch(keyword, page + 1, true);
  };

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen pb-12">
      {/* 顶部搜索栏 */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-container px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant shrink-0"
          >
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
          <div className="flex-1 flex items-center bg-surface-container-low rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">search</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="搜索目的地或灵感"
              className="bg-transparent border-none outline-none w-full text-sm font-medium text-on-surface placeholder:text-on-surface-variant/70"
              autoFocus
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue('')}
                className="text-on-surface-variant hover:text-on-surface transition-colors ml-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="text-primary font-semibold text-sm px-3 py-2 hover:bg-primary-container/30 rounded-full transition-colors shrink-0"
          >
            搜索
          </button>
        </form>
      </header>

      <div className="pt-20 px-6 max-w-2xl mx-auto">
        {/* 空状态 */}
        {!keyword && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-40">search</span>
            <p className="text-sm">输入关键词搜索目的地或推荐</p>
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <p className="text-on-surface-variant text-sm">正在搜索...</p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <span className="material-symbols-outlined text-4xl text-error">error</span>
            <p className="text-error text-sm">{error}</p>
            <button
              type="button"
              onClick={() => executeSearch(keyword, 1, false)}
              className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold"
            >
              重试
            </button>
          </div>
        )}

        {/* 搜索结果统计 */}
        {keyword && !loading && !error && (
          <p className="text-xs text-on-surface-variant mb-4">
            共找到 {total} 条结果
          </p>
        )}

        {/* 搜索结果列表 */}
        <div className="space-y-4">
          {results.map((item) => {
            const isRecommendation = item.type === 'recommendation';
            const detailLink = isRecommendation
              ? `/detail?type=recommendation&id=${item.id}`
              : `/detail?type=destination&id=${item.id}`;

            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={detailLink}
                onClick={() => isRecommendation && cacheRecommendation(item)}
                className="flex gap-4 p-4 bg-surface-container-low rounded-[1.5rem] hover:bg-surface-container-lowest transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={item.name}
                    src={item.imageUrl}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-between py-0.5 min-w-0 flex-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {isRecommendation ? '推荐' : '目的地'}
                      </span>
                    </div>
                    <h4 className="font-bold text-on-surface line-clamp-1">{item.name}</h4>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mt-0.5">{item.description}</p>
                  </div>
                  {item.price != null && item.price > 0 && (
                    <span className="text-primary font-black text-sm">
                      ¥{item.price.toLocaleString()}
                      <span className="text-xs font-medium text-on-surface-variant ml-1">起</span>
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* 空结果 */}
        {keyword && !loading && !error && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-40">search_off</span>
            <p className="text-sm">未找到相关结果，换个关键词试试</p>
          </div>
        )}

        {/* 加载更多 */}
        {hasMore && !loading && (
          <div className="flex justify-center py-6">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors disabled:opacity-60"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
