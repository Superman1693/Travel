// 行程分享公开页：无需登录，通过 share token 读取只读行程详情
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSharedItinerary, type ItineraryDetail, type ItineraryPlace } from '../services';

type PlaceType = 'attraction' | 'restaurant' | 'hotel';

const getPlaceTypeLabel = (type: PlaceType) => {
  if (type === 'restaurant') return '餐饮';
  if (type === 'hotel') return '酒店';
  return '景点';
};

const getPlaceTypeAccent = (type: PlaceType) => {
  if (type === 'restaurant') return 'border-[#ff9817] bg-[#fff4e7]';
  if (type === 'hotel') return 'border-[#6c9fff] bg-[#eef4ff]';
  return 'border-[#7ad29b] bg-[#eefaf2]';
};

const formatDateLabel = (date: string) => (date ? date : '-');

export default function ShareItinerary() {
  const { token } = useParams<{ token: string }>();
  const [detail, setDetail] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!token) {
        setError('分享链接无效');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const data = await getSharedItinerary(token);
        if (!cancelled) {
          setDetail(data);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : '分享链接无效或已失效');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const renderPlace = (place: ItineraryPlace) => (
    <div key={place.id} className="flex items-start gap-3 rounded-xl border border-[#d8dff7] bg-white p-3">
      <div className="w-14 shrink-0 text-center">
        <p className="text-sm font-black text-[#2a3562]">{place.time || '09:00'}</p>
        <p className="text-[10px] text-[#8a93b6]">{place.duration || '2h'}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-sm font-black text-[#1f2b57] truncate">{place.name}</h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold text-[#3a4d86] ${getPlaceTypeAccent(place.type)}`}>
            {getPlaceTypeLabel(place.type)}
          </span>
        </div>
        {place.distance && <p className="text-xs text-[#59648f] mt-1">{place.distance}</p>}
        {!!place.tags?.length && (
          <div className="flex gap-1.5 flex-wrap mt-1.5">
            {place.tags.map((tag) => (
              <span key={`${place.id}-${tag}`} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#e7ebff] text-[#5d6c9c] font-semibold">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen">
      <header className="px-5 py-4 flex items-center justify-between border-b border-surface-container bg-surface/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>travel_explore</span>
          </div>
          <span className="text-sm font-black text-on-surface">行境 · 行程分享</span>
        </div>
        <Link
          to="/"
          className="text-xs font-bold text-primary bg-primary-container/40 rounded-full px-3 py-1.5"
        >
          打开小程序
        </Link>
      </header>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-5">
        {loading && (
          <p className="text-sm text-on-surface-variant text-center py-16">正在加载分享行程...</p>
        )}

        {!loading && (error || !detail) && (
          <div className="rounded-2xl border border-dashed border-surface-container-high bg-surface-container-low p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-outline-variant">link_off</span>
            <p className="text-sm text-on-surface-variant">{error || '分享内容不存在'}</p>
            <Link to="/" className="inline-block px-4 py-2 rounded-full bg-primary text-white text-sm font-bold">
              回到首页
            </Link>
          </div>
        )}

        {!loading && detail && (
          <>
            <section className="rounded-3xl bg-[#dfe4ff] p-5 shadow-[0_8px_24px_rgba(86,98,156,0.12)]">
              <p className="text-xs text-[#5d688f] font-semibold">好友分享的行程</p>
              <h1 className="text-xl font-black text-[#1f2b57] mt-1">{detail.title || '旅行行程'}</h1>
              <p className="text-xs text-[#6f7aa8] mt-1">
                {`${formatDateLabel(detail.startDate)} - ${formatDateLabel(detail.endDate)} · ${detail.travelers}人${detail.destination ? ` · ${detail.destination}` : ''}`}
              </p>
              {detail.budgetPerPerson != null && (
                <p className="text-xs text-[#6f7aa8] mt-1">人均预算 ¥{Number(detail.budgetPerPerson).toLocaleString()}</p>
              )}
            </section>

            <section className="space-y-4">
              {(detail.days || []).length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-8">这个行程还没有安排地点</p>
              ) : (
                (detail.days || []).map((day) => (
                  <div key={day.dayNumber} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-[#24305f]">第{day.dayNumber}天</h3>
                      <span className="text-[11px] text-[#7d88b3]">{day.date}</span>
                    </div>
                    {(day.places || []).length === 0 ? (
                      <p className="text-xs text-[#8a93b6] px-1">当天暂无安排</p>
                    ) : (
                      (day.places || []).map(renderPlace)
                    )}
                  </div>
                ))
              )}
            </section>

            <p className="text-center text-[11px] text-on-surface-variant pb-8">此页面为只读分享，登录后可创建自己的行程</p>
          </>
        )}
      </div>
    </main>
  );
}
