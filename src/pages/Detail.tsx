import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  addPlace,
  addFavorite,
  createOrder,
  createItinerary,
  getDestinationDetail,
  getFavoriteList,
  getHotRecommendations,
  getItineraryDetail,
  getItineraryList,
  removeFavorite,
  type AddPlaceRequest,
  type DestinationDetail,
  type ItineraryDetail,
  type Itinerary,
  type Recommendation,
} from '../services';
import { buildLoginRedirectPath, hasValidToken } from '../utils/auth';

type DetailType = 'destination' | 'recommendation';

interface DisplayHighlight {
  icon: string;
  title: string;
  description: string;
}

type ActionNoticeTone = 'success' | 'error';

export default function Detail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionTone, setActionTone] = useState<ActionNoticeTone>('success');
  const [isAddingToItinerary, setIsAddingToItinerary] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [destinationDetail, setDestinationDetail] = useState<DestinationDetail | null>(null);
  const [recommendationDetail, setRecommendationDetail] = useState<Recommendation | null>(null);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const detailType: DetailType = searchParams.get('type') === 'recommendation' ? 'recommendation' : 'destination';
  const id = Number(searchParams.get('id') || 0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) {
        setError('缺少详情参数');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        if (detailType === 'destination') {
          const data = await getDestinationDetail(id);
          setDestinationDetail(data);
          setRecommendationDetail(null);
          return;
        }

        const cache = sessionStorage.getItem(`travel.recommendation.${id}`);
        if (cache) {
          const parsed = JSON.parse(cache) as Recommendation;
          setRecommendationDetail(parsed);
          setDestinationDetail(null);
          return;
        }

        const response = await getHotRecommendations(1, 100);
        const current = (response.list || []).find((item) => item.id === id);

        if (!current) {
          throw new Error('未找到推荐详情');
        }

        setRecommendationDetail(current);
        setDestinationDetail(null);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : '加载详情失败';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [detailType, id]);

  useEffect(() => {
    const fetchFavoriteState = async () => {
      if (!id || !hasValidToken()) {
        setIsFavorite(false);
        return;
      }

      try {
        const targetType = detailType === 'destination' ? 'destination' : 'recommendation';
        const result = await getFavoriteList(targetType, 1, 200);
        const favoriteHit = (result.list || []).some((item) => item.targetId === id);
        setIsFavorite(favoriteHit);
      } catch {
        setIsFavorite(false);
      }
    };

    fetchFavoriteState();
  }, [detailType, id]);

  const ensureLogin = (): boolean => {
    if (hasValidToken()) {
      return true;
    }
    const currentPath = `${location.pathname}${location.search}`;
    navigate(buildLoginRedirectPath(currentPath));
    return false;
  };

  const detailTitle = detailType === 'destination'
    ? destinationDetail
      ? `${destinationDetail.name}, ${destinationDetail.country}`
      : '目的地详情'
    : recommendationDetail?.title || '热门推荐详情';

  const detailSubtitle = detailType === 'destination'
    ? destinationDetail?.description || '探索目的地亮点'
    : recommendationDetail?.description || '查看推荐具体内容';

  const rating = detailType === 'destination' ? destinationDetail?.rating || 0 : recommendationDetail?.rating || 0;
  const reviewCount = detailType === 'destination' ? destinationDetail?.reviewCount || 0 : recommendationDetail?.reviewCount || 0;
  // 修复 O24：数据来源标注（llm = AI 生成，价格/评分为估算值）
  const dataSource = detailType === 'destination' ? destinationDetail?.dataSource : recommendationDetail?.dataSource;
  const coverImage = detailType === 'destination'
    ? destinationDetail?.imageUrl || ''
    : recommendationDetail?.imageUrl || '';

  const displayHighlights: DisplayHighlight[] = useMemo(() => {
    if (detailType === 'destination') {
      return destinationDetail?.highlights || [];
    }

    if (!recommendationDetail) {
      return [];
    }

    const firstTag = recommendationDetail.tags?.[0] || '精选主题';
    const secondTag = recommendationDetail.tags?.[1] || '旅途体验';

    return [
      {
        icon: 'local_fire_department',
        title: `${firstTag}热门路线`,
        description: '结合近期用户偏好与口碑数据，精选高热度玩法。',
      },
      {
        icon: 'payments',
        title: '预算友好',
        description: `当前参考价 ¥${recommendationDetail.price.toLocaleString()} 起，可按行程灵活调整。`,
      },
      {
        icon: 'verified',
        title: `${secondTag}口碑保障`,
        description: `评分 ${recommendationDetail.rating} / 5，累计 ${recommendationDetail.reviewCount} 条真实评价。`,
      },
    ];
  }, [detailType, destinationDetail, recommendationDetail]);

  const tags = detailType === 'destination'
    ? destinationDetail?.tags || []
    : recommendationDetail?.tags || [];

  const duration = detailType === 'destination' ? destinationDetail?.duration || '待确认' : '灵活安排';
  const groupSize = detailType === 'destination' ? destinationDetail?.groupSize || '待确认' : '1-6 人';
  const difficulty = detailType === 'destination' ? destinationDetail?.difficulty || '中等' : '轻松';
  const price = detailType === 'destination' ? destinationDetail?.price || 0 : recommendationDetail?.price || 0;
  const locationText = detailType === 'destination' ? destinationDetail?.location || '未知地点' : '热门推荐景点';

  const buildTodayIsoDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDate = (dateStr: string): Date => {
    return new Date(`${dateStr}T00:00:00`);
  };

  const isSamePlaceName = (left: string, right: string): boolean => {
    return left.trim().toLowerCase() === right.trim().toLowerCase();
  };

  const pickNearestEmptyDay = (detail: ItineraryDetail): number => {
    const days = detail.days || [];
    if (days.length === 0) return 1;

    const now = new Date();
    const emptyDays = days.filter((day) => (day.places || []).length === 0);
    if (emptyDays.length > 0) {
      return emptyDays
        .slice()
        .sort((a, b) => {
          const diffA = Math.abs(parseDate(a.date).getTime() - now.getTime());
          const diffB = Math.abs(parseDate(b.date).getTime() - now.getTime());
          if (diffA !== diffB) return diffA - diffB;
          return a.dayNumber - b.dayNumber;
        })[0].dayNumber;
    }

    // 没有空白天时，选择地点数量最少且日期最近的一天
    return days
      .slice()
      .sort((a, b) => {
        const countA = (a.places || []).length;
        const countB = (b.places || []).length;
        if (countA !== countB) return countA - countB;
        const diffA = Math.abs(parseDate(a.date).getTime() - now.getTime());
        const diffB = Math.abs(parseDate(b.date).getTime() - now.getTime());
        if (diffA !== diffB) return diffA - diffB;
        return a.dayNumber - b.dayNumber;
      })[0].dayNumber;
  };

  const pickTimeForSelectedDay = (detail: ItineraryDetail, dayNumber: number): string => {
    const targetDay = (detail.days || []).find((day) => day.dayNumber === dayNumber);
    const places = targetDay?.places || [];
    if (places.length === 0) return '09:00';

    const validTimes = places
      .map((item) => item.time)
      .filter((time): time is string => Boolean(time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)))
      .sort();

    if (validTimes.length === 0) return '09:00';

    const last = validTimes[validTimes.length - 1];
    const [hour, minute] = last.split(':').map(Number);
    const totalMinute = hour * 60 + minute + 90;
    const capped = Math.min(totalMinute, 23 * 60 + 30);
    const nextHour = Math.floor(capped / 60);
    const nextMinute = capped % 60;
    return `${String(nextHour).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`;
  };

  const resolvePlacePayload = (): Omit<AddPlaceRequest, 'dayNumber' | 'time'> | null => {
    if (detailType === 'destination' && destinationDetail) {
      return {
        name: destinationDetail.name,
        type: 'attraction',
        imageUrl: destinationDetail.imageUrl,
        duration: destinationDetail.duration || undefined,
        distance: destinationDetail.location || undefined,
        tags: destinationDetail.tags?.slice(0, 4) || undefined,
      };
    }

    if (detailType === 'recommendation' && recommendationDetail) {
      return {
        name: recommendationDetail.title,
        type: 'attraction',
        imageUrl: recommendationDetail.imageUrl,
        duration: '建议 2-3 小时',
        tags: recommendationDetail.tags?.slice(0, 4) || ['热门推荐'],
      };
    }

    return null;
  };

  const ensureTargetItinerary = async (): Promise<Itinerary> => {
    const list = await getItineraryList();
    if (Array.isArray(list) && list.length > 0) {
      return list[0];
    }

    const today = buildTodayIsoDate();
    const destination = detailType === 'destination'
      ? destinationDetail?.name || destinationDetail?.country || '我的行程'
      : recommendationDetail?.title || '我的行程';

    return createItinerary({
      title: `${destination}行程`,
      destination,
      startDate: today,
      endDate: today,
      travelers: 2,
    });
  };

  const handleAddToItinerary = async () => {
    if (!ensureLogin()) {
      return;
    }

    const placePayload = resolvePlacePayload();
    if (!placePayload) {
      setActionTone('error');
      setActionMessage('当前内容不可加入行程，请稍后重试');
      return;
    }

    try {
      setIsAddingToItinerary(true);
      setActionMessage('');
      const itinerary = await ensureTargetItinerary();
      const itineraryDetail = await getItineraryDetail(itinerary.id);

      const duplicate = (itineraryDetail.days || [])
        .flatMap((day) => day.places || [])
        .some((place) => isSamePlaceName(place.name, placePayload.name));
      if (duplicate) {
        setActionTone('error');
        setActionMessage(`「${itinerary.title}」中已存在同名地点：${placePayload.name}`);
        return;
      }

      const dayNumber = pickNearestEmptyDay(itineraryDetail);
      const time = pickTimeForSelectedDay(itineraryDetail, dayNumber);

      await addPlace(itinerary.id, {
        ...placePayload,
        dayNumber,
        time,
      });

      setActionTone('success');
      setActionMessage(`已将 ${placePayload.name} 加入「${itinerary.title}」第${dayNumber}天`);
    } catch (addError) {
      const message = addError instanceof Error ? addError.message : '加入行程失败，请稍后重试';
      setActionTone('error');
      setActionMessage(message);
    } finally {
      setIsAddingToItinerary(false);
    }
  };

  const buildOrderPayload = () => {
    const userInfoRaw = localStorage.getItem('userInfo');
    const securityRaw = localStorage.getItem('travel.settings.securityCompletion');
    let contactName = '旅行者';
    let contactPhone = '';

    if (userInfoRaw) {
      try {
        const parsed = JSON.parse(userInfoRaw) as { username?: string };
        if (parsed.username) {
          contactName = parsed.username;
        }
      } catch {
        // 忽略本地缓存解析异常，使用默认联系人
      }
    }

    // 从安全设置中读取本地保存的手机号
    if (securityRaw) {
      try {
        const security = JSON.parse(securityRaw) as { phone?: string };
        if (security.phone) {
          contactPhone = security.phone;
        }
      } catch {
        // 忽略解析异常
      }
    }

    return {
      productId: id,
      productType: detailType === 'destination' ? 'destination' as const : 'package' as const,
      travelers: 2,
      startDate: buildTodayIsoDate(),
      contactName,
      // TODO: 当后端提供手机号字段后，此处应使用用户真实手机号
      contactPhone: contactPhone || '13800000000',
    };
  };

  const handleBookNow = async () => {
    if (!ensureLogin()) {
      return;
    }

    if (!id) {
      setActionTone('error');
      setActionMessage('商品信息缺失，无法下单');
      return;
    }

    try {
      setIsBooking(true);
      setActionMessage('');
      const order = await createOrder(buildOrderPayload());
      setActionTone('success');
      setActionMessage(`下单成功，订单号 ${order.orderNo}`);
    } catch (bookError) {
      const message = bookError instanceof Error ? bookError.message : '下单失败，请稍后重试';
      setActionTone('error');
      setActionMessage(message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!ensureLogin()) {
      return;
    }

    try {
      setIsFavoriteLoading(true);
      const targetType = detailType === 'destination' ? 'destination' : 'recommendation';
      if (isFavorite) {
        await removeFavorite(id, targetType);
        setIsFavorite(false);
        setActionTone('success');
        setActionMessage('已取消收藏');
      } else {
        await addFavorite(id, targetType);
        setIsFavorite(true);
        setActionTone('success');
        setActionMessage('收藏成功');
      }
    } catch (favError) {
      const message = favError instanceof Error ? favError.message : '收藏操作失败';
      setActionTone('error');
      setActionMessage(message);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="font-body text-on-surface bg-surface min-h-screen flex items-center justify-center">
        <p className="text-on-surface-variant">正在加载具体内容...</p>
      </main>
    );
  }

  if (error || !coverImage) {
    return (
      <main className="font-body text-on-surface bg-surface min-h-screen flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-error text-sm">{error || '详情内容不存在'}</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold"
        >
          返回上一页
        </button>
      </main>
    );
  }

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen pb-24 relative selection:bg-primary/20">
      <div className="relative w-full h-[50vh] min-h-[350px]">
        <img
          className="w-full h-full object-cover" 
          alt={detailTitle}
          src={coverImage}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-surface"></div>

        <header className="absolute top-0 w-full px-6 py-12 flex justify-between items-center z-20">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all disabled:opacity-60"
              onClick={handleToggleFavorite}
              disabled={isFavoriteLoading}
            >
              <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: `'FILL' ${isFavorite ? 1 : 0}`}}>favorite</span>
            </button>
          </div>
        </header>
      </div>

      <div className="relative -mt-10 px-6 z-10 w-full max-w-2xl mx-auto space-y-8">
        {actionMessage && (
          <section className="sticky top-2 z-20">
            <div
              className={`rounded-2xl px-4 py-2.5 text-sm backdrop-blur-md border shadow-[0_8px_24px_rgba(35,44,81,0.1)] ${
                actionTone === 'success'
                  ? 'bg-secondary-container/75 text-on-secondary-container border-secondary/20'
                  : 'bg-error/12 text-error border-error/20'
              }`}
            >
              {actionMessage}
            </div>
          </section>
        )}

        <section>
          <div className="flex gap-2 mb-3 flex-wrap">
            {(tags.length > 0 ? tags : ['精选推荐']).slice(0, 3).map((tag) => (
              <span key={tag} className="bg-secondary-container text-on-secondary-container text-xs px-2.5 py-1 rounded-sm font-bold tracking-wide">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-black font-headline text-on-surface leading-tight mb-2">{detailTitle}</h1>
          <p className="text-lg font-medium text-on-surface-variant mb-4">{detailSubtitle}</p>

          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="flex items-center text-tertiary">
              <span className="material-symbols-outlined text-[18px] mr-1" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="text-base font-bold text-on-surface mr-1">{rating.toFixed(1)}</span>
              <span className="text-on-surface-variant font-medium underline decoration-surface-container-high underline-offset-2 cursor-pointer">
                ({reviewCount.toLocaleString()} 条评价)
              </span>
              {dataSource === 'llm' && (
                <span className="ml-2 text-[10px] font-semibold text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded whitespace-nowrap">
                  AI 生成，仅供参考
                </span>
              )}
            </div>
            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
            <div className="flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] mr-1">location_on</span>
              {locationText}
            </div>
          </div>
        </section>

        <hr className="border-surface-container-low" />

        <section className="flex justify-between items-center bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_24px_rgba(35,44,81,0.04)]">
          <div className="text-center">
            <span className="material-symbols-outlined text-outline mb-1 text-2xl">schedule</span>
            <p className="text-xs text-on-surface-variant font-medium">时长</p>
            <p className="text-sm font-bold text-on-surface mt-0.5">{duration}</p>
          </div>
          <div className="w-px h-10 bg-surface-container-low"></div>
          <div className="text-center">
            <span className="material-symbols-outlined text-outline mb-1 text-2xl">group</span>
            <p className="text-xs text-on-surface-variant font-medium">成团人数</p>
            <p className="text-sm font-bold text-on-surface mt-0.5">{groupSize}</p>
          </div>
          <div className="w-px h-10 bg-surface-container-low"></div>
          <div className="text-center">
            <span className="material-symbols-outlined text-outline mb-1 text-2xl">directions_walk</span>
            <p className="text-xs text-on-surface-variant font-medium">体力消耗</p>
            <p className="text-sm font-bold text-on-surface mt-0.5">{difficulty}</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold font-headline mb-4">关于此行程</h2>
          <p className="text-on-surface-variant leading-relaxed mb-4 text-[15px]">
            {detailSubtitle}
          </p>
          <button className="text-primary font-bold text-sm flex items-center hover:underline group">
            查看完整介绍 
            <span className="material-symbols-outlined text-[18px] ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </section>

        <section>
          <h2 className="text-xl font-bold font-headline mb-4">行程亮点</h2>
          <div className="space-y-4">
            {displayHighlights.length === 0 && (
              <p className="text-sm text-on-surface-variant">暂无亮点信息</p>
            )}

            {displayHighlights.map((highlight) => (
              <div key={highlight.title} className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>{highlight.icon || 'place'}</span>
                </div>
                <div>
                  <h3 className="font-bold text-on-surface">{highlight.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-1">{highlight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-10">
          <div className="w-full h-48 bg-surface-container rounded-2xl overflow-hidden relative">
             <img
               className="w-full h-full object-cover opacity-60"
               src={coverImage}
               alt="Map"
             />
             <div className="absolute inset-0 flex items-center justify-center">
                 <button className="bg-white/90 backdrop-blur text-on-surface px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 hover:bg-white active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    查看地图路线
                 </button>
             </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom Booking Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 px-4 pb-safe pb-4">
        <div className="mx-auto max-w-2xl rounded-2xl border border-surface-container bg-surface/92 backdrop-blur-xl shadow-[0_10px_34px_rgba(35,44,81,0.16)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-on-surface-variant font-semibold tracking-wide">总价</p>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-3xl font-black text-on-surface font-headline leading-none">{dataSource === 'llm' ? '约 ' : ''}¥{price.toLocaleString()}</span>
                <span className="text-xs text-on-surface-variant font-medium mb-1">/ 人起</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
              <button
                className="min-w-[132px] whitespace-nowrap bg-primary-container text-on-primary-container font-bold text-sm px-4 py-3 rounded-full border border-primary/25 active:scale-95 transition-all disabled:opacity-60"
                onClick={handleAddToItinerary}
                disabled={isAddingToItinerary}
              >
                {isAddingToItinerary ? '加入中...' : '加入我的行程'}
              </button>
              <button
                className="min-w-[112px] whitespace-nowrap bg-primary text-white font-bold text-sm px-5 py-3 rounded-full shadow-[0_8px_24px_rgba(0,88,187,0.28)] hover:bg-primary-dim hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all disabled:opacity-60"
                onClick={handleBookNow}
                disabled={isBooking}
              >
                {isBooking ? '下单中...' : '立即预订'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
