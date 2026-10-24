import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';
import defaultAvatar from '../assets/unnamed.png';
import {
  getFeaturedDestinations,
  getHotRecommendationsByLocation,
  resolveLocationByCoordinates,
  type Destination,
  type Recommendation
} from '../services';
import { readLocationCache, writeLocationCache } from '../utils/location';

export default function Home() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [locationText, setLocationText] = useState('未定位');
  const [locationError, setLocationError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [hasLocated, setHasLocated] = useState(false);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryToast, setCategoryToast] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchKeyword.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const showCategoryToast = (message: string) => {
    setCategoryToast(message);
    setTimeout(() => setCategoryToast(''), 2000);
  };

  const fetchRecommendationsByLocation = async (location: string) => {
    setIsRecommendationsLoading(true);
    try {
      const recData = await getHotRecommendationsByLocation(location, 1, 10);
      setRecommendations(recData.list || []);
    } catch (error) {
      console.error('按位置获取热门推荐失败:', error);
      setLocationError('已定位，但位置推荐加载失败');
    } finally {
      setIsRecommendationsLoading(false);
    }
  };

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

  const cacheRecommendation = (item: Recommendation) => {
    sessionStorage.setItem(`travel.recommendation.${item.id}`, JSON.stringify(item));
  };

  // 加载数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 仅加载目的地；热门推荐在定位后再加载
        const destData = await getFeaturedDestinations(10).catch(() => []);
        setDestinations(destData);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const cachedLocation = readLocationCache();
    if (cachedLocation) {
      setHasLocated(true);
      setLocationText(cachedLocation.displayText);
      void fetchRecommendationsByLocation(cachedLocation.queryText);
    }
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('当前浏览器不支持定位');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const previous = readLocationCache();

        // 先快：先给状态反馈，避免先显示旧缓存城市造成误判
        setLocationText('定位成功，正在识别省市...');
        setHasLocated(true);
        setIsLocating(false);

        try {
          // 后准：交由后端高德MCP反查省市并刷新推荐
          const locationInfo = await resolveLocationByCoordinates(latitude, longitude);
          setLocationText(locationInfo.displayText);
          writeLocationCache({
            displayText: locationInfo.displayText,
            queryText: locationInfo.queryText,
            province: locationInfo.province,
            city: locationInfo.city,
            latitude,
            longitude,
            updatedAt: Date.now(),
          });
          await fetchRecommendationsByLocation(locationInfo.queryText);
          return;
        } catch {
          // 后端解析失败时继续使用缓存兜底
        }

        if (previous?.queryText) {
          setLocationText('省市识别失败');
          setLocationError('省市识别失败，已使用上次位置推荐');
          void fetchRecommendationsByLocation(previous.queryText);
          return;
        }

        setLocationError('省市识别失败，请重试定位');
      },
      () => {
        const cachedLocation = readLocationCache();
        if (cachedLocation) {
          setHasLocated(true);
          setLocationText(cachedLocation.displayText);
          setLocationError('定位失败，已使用上次位置');
          void fetchRecommendationsByLocation(cachedLocation.queryText);
        } else {
          setLocationError('定位失败，请检查定位权限');
        }
        setIsLocating(false);
      },
      {
        // 主动定位时优先准确度，避免同省误定位到其他城市
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const isLocationSuccess = hasLocated && !isLocating && !locationError;
  const isLocationFailed = !isLocating && Boolean(locationError);

  return (
    <main className="text-on-surface bg-surface min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-40 bg-surface/90 border-b border-surface-container backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-surface-container">
            <img
              className="w-full h-full object-cover"
              alt="Profile"
              src={defaultAvatar}
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-on-surface font-black text-xl font-headline tracking-wider">发现灵感</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors active:scale-95 ${
              isLocationSuccess
                ? 'text-primary bg-primary-container/35 hover:bg-primary-container/50'
                : isLocationFailed
                  ? 'text-error bg-error/15 hover:bg-error/20'
                  : 'text-on-surface-variant bg-surface-container-low hover:bg-surface-container'
            }`}
            onClick={handleLocate}
            disabled={isLocating}
            aria-label="定位"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <MapPin size={18} />}
          </button>
          <div className="text-right">
            <p className={`text-[11px] leading-4 ${isLocationSuccess ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
              {isLocating ? '定位中...' : locationText}
            </p>
            {locationError && <p className="text-[11px] text-error leading-4">{locationError}</p>}
          </div>
        </div>
      </header>

      <div className="pt-24 px-6 max-w-5xl mx-auto space-y-10">
        {/* Animated Search Bar */}
        <form onSubmit={handleSearch} className="relative group">
          <div className="flex items-center bg-surface-container-low rounded-full px-6 py-4 transition-all duration-300 group-focus-within:bg-surface-container-lowest group-focus-within:shadow-xl group-focus-within:ring-2 group-focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
            <input
              className="bg-transparent border-none outline-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant font-medium"
              placeholder="搜索目的地或灵感"
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            {searchKeyword && (
              <button
                type="submit"
                className="text-primary ml-2 hover:bg-primary-container/30 rounded-full p-1 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            )}
          </div>
        </form>

        {/* Dynamic Category Bento */}
        {categoryToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface text-sm px-4 py-2 rounded-full shadow-lg">
            {categoryToast}
          </div>
        )}
        <section className="grid grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => showCategoryToast('机票功能开发中')}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">flight</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">机票</span>
          </button>
          <button
            type="button"
            onClick={() => showCategoryToast('酒店功能开发中')}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">hotel</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">酒店</span>
          </button>
          <Link
            to="/destinations"
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">attractions</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">景点</span>
          </Link>
          <Link
            to="/recommendations"
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-variant/40 flex items-center justify-center text-on-surface-variant group-hover:bg-on-surface group-hover:text-surface transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">map</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">攻略</span>
          </Link>
        </section>

        {/* Featured Carousel (Asymmetric) */}
        <section className="space-y-4 overflow-hidden -mx-6 px-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-extrabold text-on-surface font-headline chinese-header">本周精选目的地</h2>
            <Link to="/destinations" className="text-primary font-semibold text-sm hover:underline">查看全部</Link>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 pr-12 snap-x">
            {!loading && destinations.length === 0 && (
              <div className="text-on-surface-variant text-sm py-6">暂无推荐目的地</div>
            )}

            {destinations.map((destination, index) => (
              <Link
                key={destination.id}
                to={`/detail?type=destination&id=${destination.id}`}
                className={`flex-shrink-0 ${index === 0 ? 'w-80' : 'w-64'} h-[420px] relative rounded-[2rem] overflow-hidden group shadow-lg cursor-pointer snap-center active:scale-[0.98] transition-transform ${index === 1 ? 'mt-8' : ''}`}
              >
                <img
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={`${destination.name}`}
                  src={destination.imageUrl}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent"></div>
                <div className={`absolute bottom-0 left-0 ${index === 0 ? 'p-8' : 'p-6'} w-full`}>
                  <span className={`${getTagClass(destination.tagColor)} px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block`}>
                    {destination.tag}
                  </span>
                  <h3 className={`text-white ${index === 0 ? 'text-3xl' : 'text-2xl'} font-black mb-1`}>
                    {destination.name}, {destination.country}
                  </h3>
                  <p className="text-white/80 text-sm font-medium">{destination.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Personalized Recommendations */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-extrabold text-on-surface font-headline chinese-header">热门推荐</h2>
            <Link to="/recommendations" className="text-primary font-semibold text-sm hover:underline">查看全部</Link>
          </div>
          <div className="space-y-6">
            {!hasLocated && !isLocating && (
              <div className="text-on-surface-variant text-sm">请先点击右上角定位获取热门推荐</div>
            )}

            {hasLocated && isRecommendationsLoading && (
              <div className="text-on-surface-variant text-sm">正在加载位置推荐...</div>
            )}

            {hasLocated && !isRecommendationsLoading && recommendations.length === 0 && (
              <div className="text-on-surface-variant text-sm">暂无热门推荐</div>
            )}

            {recommendations.map((item) => (
              <Link
                key={item.id}
                to={`/detail?type=recommendation&id=${item.id}`}
                onClick={() => cacheRecommendation(item)}
                className="flex gap-4 p-4 bg-surface-container-low rounded-[1.5rem] hover:bg-surface-container-lowest transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                  <img
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    alt={item.title}
                    src={item.imageUrl}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-between py-1 min-w-0 flex-1">
                  <div>
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {item.tags?.slice(0, 2).map((tag, idx) => (
                        <span key={`${item.id}-${tag || 'tag'}-${idx}`} className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">{tag || '推荐'}</span>
                      ))}
                    </div>
                    <h4 className="font-bold text-lg text-on-surface line-clamp-2">{item.title}</h4>
                    <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-primary font-black text-lg">¥{item.price.toLocaleString()} <span className="text-xs font-medium text-on-surface-variant">起</span></span>
                    <div className="flex items-center text-xs text-on-surface-variant font-medium whitespace-nowrap">
                      <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      {item.rating} ({item.reviewCount} 评价)
                    </div>
                  </div>
                </div>
              </Link>
            ))}

          </div>
        </section>
      </div>

      {/* FAB for AI Chat */}
      <Link to="/chat" className="fixed right-6 bottom-28 w-16 h-16 bg-primary rounded-full shadow-[0_12px_32px_rgba(35,44,81,0.2)] flex items-center justify-center text-white active:scale-90 transition-transform z-30">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
      </Link>
    </main>
  );
}
