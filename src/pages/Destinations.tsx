import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFeaturedDestinations, type Destination } from '../services';

export default function Destinations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<Destination[]>([]);

  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const data = await getFeaturedDestinations(30);
        setDestinations(data);
      } catch (error) {
        console.error('获取目的地列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  const getTagClass = (tagColor?: string): string => {
    switch (tagColor) {
      case 'primary':
        return 'bg-primary-container text-on-primary-container';
      case 'tertiary':
        return 'bg-tertiary-container text-on-tertiary-container';
      case 'secondary':
      default:
        return 'bg-secondary-container text-on-secondary-container';
    }
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-black font-headline">本周精选目的地</h1>
        <div className="w-10 h-10" />
      </header>

      <section className="px-6 py-6 space-y-4">
        {loading && (
          <p className="text-sm text-on-surface-variant">正在加载目的地...</p>
        )}

        {!loading && destinations.length === 0 && (
          <p className="text-sm text-on-surface-variant">暂无目的地数据</p>
        )}

        {destinations.map((destination) => (
          <Link
            key={destination.id}
            to={`/detail?id=${destination.id}`}
            className="block rounded-3xl overflow-hidden bg-surface-container-low shadow-[0_8px_24px_rgba(35,44,81,0.08)] active:scale-[0.99] transition-transform"
          >
            <div className="relative h-56">
              <img
                src={destination.imageUrl}
                alt={destination.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5 w-full">
                <span className={`${getTagClass(destination.tagColor)} px-3 py-1 rounded-full text-xs font-bold inline-block mb-2`}>
                  {destination.tag}
                </span>
                <h2 className="text-white text-2xl font-black">{destination.name}, {destination.country}</h2>
                <p className="text-white/90 text-sm mt-1">{destination.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}