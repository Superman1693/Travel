import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFavoriteList, removeFavorite, type Favorite } from '../services';

type FavoriteFilter = 'all' | 'destination' | 'recommendation';

export default function Favorites() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filter, setFilter] = useState<FavoriteFilter>('all');

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError('');
      const targetType = filter === 'all' ? undefined : filter;
      const result = await getFavoriteList(targetType, 1, 200);
      setFavorites(result.list || []);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '加载收藏失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [filter]);

  const handleRemove = async (item: Favorite) => {
    try {
      await removeFavorite(item.targetId, item.targetType);
      setFavorites((prev) => prev.filter((it) => it.id !== item.id));
    } catch (removeError) {
      const message = removeError instanceof Error ? removeError.message : '取消收藏失败';
      setError(message);
    }
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold font-headline">我的收藏</h1>
        <span className="text-xs text-on-surface-variant">{favorites.length} 项</span>
      </header>

      <section className="px-6 py-4">
        <div className="flex gap-2 mb-4">
          {(['all', 'destination', 'recommendation'] as FavoriteFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                filter === item
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {item === 'all' ? '全部' : item === 'destination' ? '目的地' : '推荐'}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-on-surface-variant">正在加载收藏...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {!loading && !error && favorites.length === 0 && (
          <p className="text-sm text-on-surface-variant">还没有收藏，去详情页点个爱心吧。</p>
        )}

        <div className="space-y-4">
          {favorites.map((item) => (
            <article key={item.id} className="bg-surface-container-low rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3">
                <img
                  src={item.targetImage}
                  alt={item.targetName}
                  className="w-24 h-24 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface-variant mb-1">
                    {item.targetType === 'destination' ? '目的地' : '推荐'}
                  </p>
                  <h3 className="font-bold text-on-surface line-clamp-2">{item.targetName}</h3>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/detail?type=${item.targetType === 'destination' ? 'destination' : 'recommendation'}&id=${item.targetId}`}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary text-white"
                    >
                      查看详情
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface text-error border border-error/30"
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
