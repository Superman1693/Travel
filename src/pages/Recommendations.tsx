import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHotRecommendations, type Recommendation } from '../services';

export default function Recommendations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await getHotRecommendations(1, 30);
        setRecommendations(data.list || []);
      } catch (error) {
        console.error('获取热门推荐失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
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

        {!loading && recommendations.length === 0 && (
          <p className="text-sm text-on-surface-variant">暂无热门推荐</p>
        )}

        {recommendations.map((item) => (
          <article
            key={item.id}
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
                  ¥{item.price.toLocaleString()} <span className="text-xs font-medium text-on-surface-variant">起</span>
                </span>
                <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">
                  {item.rating} ({item.reviewCount} 评价)
                </span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}