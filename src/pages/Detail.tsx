import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import {
  addDestinationReview,
  addPlace,
  addFavorite,
  createOrder,
  createItinerary,
  deleteDestinationReview,
  getDestinationDetail,
  getDestinationReviews,
  getFavoriteList,
  getHotRecommendations,
  getItineraryDetail,
  getItineraryList,
  getRecommendationById,
  removeFavorite,
  updateDestinationReview,
  type AddPlaceRequest,
  type DestinationDetail,
  type DestinationReview,
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

const REVIEW_PAGE_SIZE = 5;
const REVIEW_MAX_LENGTH = 500;

// 星形展示（只读）：用于用户评分摘要与评价列表
const renderStars = (value: number, sizeClass: string = 'text-[16px]') => (
  <span className="flex items-center gap-0.5" aria-label={`${value} 星`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`material-symbols-outlined ${sizeClass} ${star <= Math.round(value) ? 'text-amber-400' : 'text-outline-variant'}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
    ))}
  </span>
);

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

  // 功能4：用户评价状态（仅 destination 详情使用）
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reviews, setReviews] = useState<DestinationReview[]>([]);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewContent, setReviewContent] = useState('');

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

        // 优先使用单条推荐接口；失败时回退原有「会话缓存 → 热门列表」绕行取数兜底
        try {
          const detail = await getRecommendationById(id);
          setRecommendationDetail(detail);
          setDestinationDetail(null);
          return;
        } catch {
          // 单条接口不可用时走下方兜底逻辑
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

  // 功能4：加载评价列表（第 1 页覆盖，翻页追加）
  const loadReviews = async (page: number) => {
    if (!id || detailType !== 'destination') {
      return;
    }

    try {
      if (page === 1) {
        setReviewsLoading(true);
      } else {
        setReviewsLoadingMore(true);
      }
      const result = await getDestinationReviews(id, page, REVIEW_PAGE_SIZE);
      const list = result.list || [];
      setReviews((prev) => (page === 1 ? list : [...prev, ...list]));
      setReviewsTotal(result.total || 0);
      setReviewsPage(page);
    } catch {
      // 评价加载失败不阻塞详情主内容，保持已有列表
    } finally {
      setReviewsLoading(false);
      setReviewsLoadingMore(false);
    }
  };

  const resetReviewForm = () => {
    setEditingReviewId(null);
    setReviewRating(0);
    setReviewContent('');
  };

  useEffect(() => {
    setIsLoggedIn(hasValidToken());
    setReviews([]);
    setReviewsTotal(0);
    setReviewsPage(1);
    resetReviewForm();

    if (detailType === 'destination' && id) {
      loadReviews(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailType, id]);

  const refreshUserRatingSummary = async () => {
    try {
      const fresh = await getDestinationDetail(id);
      setDestinationDetail(fresh);
    } catch {
      // 摘要刷新失败不提示，列表已是最新的
    }
  };

  const handleSubmitReview = async () => {
    if (!ensureLogin()) {
      return;
    }

    const trimmed = reviewContent.trim();
    if (reviewRating < 1) {
      setActionTone('error');
      setActionMessage('请先点选评分（1-5 星）');
      return;
    }
    if (!trimmed) {
      setActionTone('error');
      setActionMessage('请填写评价内容');
      return;
    }

    try {
      setSubmittingReview(true);
      setActionMessage('');
      if (editingReviewId) {
        await updateDestinationReview(editingReviewId, { destinationId: id, rating: reviewRating, content: trimmed });
        setActionTone('success');
        setActionMessage('评价已更新');
      } else {
        await addDestinationReview({ destinationId: id, rating: reviewRating, content: trimmed });
        setActionTone('success');
        setActionMessage('评价发表成功');
      }
      resetReviewForm();
      setIsLoggedIn(hasValidToken());
      await Promise.all([loadReviews(1), refreshUserRatingSummary()]);
    } catch (reviewError) {
      setActionTone('error');
      setActionMessage(reviewError instanceof Error ? reviewError.message : '评价提交失败，请稍后重试');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEditReview = (review: DestinationReview) => {
    setEditingReviewId(review.id);
    setReviewRating(review.rating);
    setReviewContent(review.content);
    setActionTone('success');
    setActionMessage('正在编辑你的评价，修改后记得保存');
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!ensureLogin()) {
      return;
    }
    const confirmed = window.confirm('确认删除这条评价吗？');
    if (!confirmed) return;

    try {
      setSubmittingReview(true);
      setActionMessage('');
      await deleteDestinationReview(reviewId);
      if (editingReviewId === reviewId) {
        resetReviewForm();
      }
      setIsLoggedIn(hasValidToken());
      setActionTone('success');
      setActionMessage('评价已删除');
      await Promise.all([loadReviews(1), refreshUserRatingSummary()]);
    } catch (deleteError) {
      setActionTone('error');
      setActionMessage(deleteError instanceof Error ? deleteError.message : '删除评价失败，请稍后重试');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleLoadMoreReviews = () => {
    if (reviewsLoadingMore) return;
    loadReviews(reviewsPage + 1);
  };

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
  // 功能4：用户评分摘要（与 AI 平台评分区分）
  const userAvgRating = detailType === 'destination' ? destinationDetail?.userAvgRating ?? null : null;
  const userReviewCount = detailType === 'destination' ? destinationDetail?.userReviewCount || 0 : 0;
  const hasMoreReviews = reviews.length < reviewsTotal;
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
        const parsed = JSON.parse(userInfoRaw) as { username?: string; phone?: string };
        if (parsed.username) {
          contactName = parsed.username;
        }
        // 优先使用登录用户信息中携带的手机号
        if (parsed.phone) {
          contactPhone = parsed.phone;
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
      // 无可用手机号时留空，由 handleBookNow 在提交前拦截校验
      contactPhone,
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

    const orderPayload = buildOrderPayload();
    if (!orderPayload.contactPhone.trim()) {
      setActionTone('error');
      setActionMessage('请先在「设置 - 账号安全」中补全联系电话后再下单');
      return;
    }

    try {
      setIsBooking(true);
      setActionMessage('');
      const order = await createOrder(orderPayload);
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

  // 分享：复制当前页面链接到剪贴板，复用现有 actionMessage 提示反馈
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionTone('success');
      setActionMessage('链接已复制，快去分享吧');
    } catch {
      setActionTone('error');
      setActionMessage('复制失败，请手动复制地址栏链接');
    }
  };

  // 查看地图路线：新窗口打开高德地图搜索当前目的地/推荐名称
  const handleOpenMapRoute = () => {
    const keyword = (detailType === 'destination' ? destinationDetail?.name : recommendationDetail?.title) || detailTitle;
    const trimmed = keyword.trim();
    if (!trimmed) {
      return;
    }
    window.open(`https://uri.amap.com/search?keyword=${encodeURIComponent(trimmed)}`, '_blank', 'noopener');
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
          <button onClick={() => navigate(-1)} aria-label="返回" className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-3">
            <button
              className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all"
              onClick={handleShare}
              aria-label="分享"
            >
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
              {/* 功能4：平台评分（AI 生成口径）与用户评分分开展示 */}
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded mr-1.5 whitespace-nowrap">平台评分</span>
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

        {/* 功能4：用户评价区（仅目的地详情） */}
        {detailType === 'destination' && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold font-headline">用户评价</h2>
              <span className="text-xs text-on-surface-variant">{userReviewCount} 条</span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_4px_24px_rgba(35,44,81,0.04)] space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded whitespace-nowrap">用户评分</span>
                {userAvgRating != null && userReviewCount > 0 ? (
                  <>
                    {renderStars(userAvgRating, 'text-[18px]')}
                    <span className="text-base font-bold text-on-surface">{userAvgRating.toFixed(1)}</span>
                    <span className="text-xs text-on-surface-variant">来自 {userReviewCount} 位用户的真实评价</span>
                  </>
                ) : (
                  <span className="text-sm text-on-surface-variant">暂无用户评价</span>
                )}
              </div>

              <hr className="border-surface-container-low" />

              {isLoggedIn ? (
                <form
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmitReview();
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} 星`}
                        className="cursor-pointer active:scale-90 transition-transform"
                        onClick={() => setReviewRating(star)}
                      >
                        <Star
                          size={26}
                          className={star <= reviewRating ? 'text-amber-400' : 'text-outline-variant'}
                          fill={star <= reviewRating ? 'currentColor' : 'none'}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-on-surface-variant ml-2">
                      {editingReviewId ? '正在修改你的评价' : '为这个目的地打分'}
                    </span>
                  </div>
                  <textarea
                    className="w-full rounded-xl border border-surface-container-high bg-surface p-3 text-sm outline-none focus:ring-2 ring-primary/30 resize-none"
                    rows={3}
                    maxLength={REVIEW_MAX_LENGTH}
                    placeholder="分享你的真实体验（500 字以内）..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-on-surface-variant">{reviewContent.length}/{REVIEW_MAX_LENGTH}</span>
                    <div className="flex gap-2">
                      {editingReviewId && (
                        <button
                          type="button"
                          className="px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant text-sm font-bold active:scale-95 transition-all"
                          onClick={resetReviewForm}
                        >
                          取消
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold active:scale-95 transition-all disabled:opacity-60"
                      >
                        {submittingReview ? '提交中...' : editingReviewId ? '保存修改' : '发表评价'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-on-surface-variant">登录后可以发表和修改你的评价</p>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold active:scale-95 transition-all"
                    onClick={() => ensureLogin()}
                  >
                    去登录
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {reviewsLoading ? (
                  <p className="text-sm text-on-surface-variant">评价加载中...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">还没有评价，来发表第一条吧</p>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review.id}
                      className={`rounded-xl p-4 ${review.mine ? 'bg-primary-container/20 border border-primary/20' : 'bg-surface'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {review.avatar ? (
                            <img
                              src={review.avatar}
                              alt={review.username || '用户头像'}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary text-xs font-bold shrink-0">
                              {(review.username || '旅').slice(0, 1)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">{review.username || '匿名用户'}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {renderStars(review.rating, 'text-[12px]')}
                              <span className="text-[10px] text-on-surface-variant">{(review.createTime || '').slice(0, 10)}</span>
                            </div>
                          </div>
                        </div>
                        {review.mine && (
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-primary-container/40 text-primary active:scale-95 transition-transform"
                              onClick={() => handleStartEditReview(review)}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              className="text-xs font-bold px-2.5 py-1.5 rounded-full bg-error/10 text-error active:scale-95 transition-transform"
                              onClick={() => handleDeleteReview(review.id)}
                              disabled={submittingReview}
                            >
                              删除
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-on-surface mt-2 leading-relaxed whitespace-pre-wrap break-words">{review.content}</p>
                    </div>
                  ))
                )}

                {!reviewsLoading && hasMoreReviews && (
                  <button
                    type="button"
                    className="w-full py-2.5 rounded-full border border-outline-variant text-primary text-sm font-bold hover:bg-primary-container/20 active:scale-95 transition-all disabled:opacity-60"
                    onClick={handleLoadMoreReviews}
                    disabled={reviewsLoadingMore}
                  >
                    {reviewsLoadingMore ? '加载中...' : `加载更多评价（共 ${reviewsTotal} 条）`}
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        <section className="pb-10">
          <div className="w-full h-48 bg-surface-container rounded-2xl overflow-hidden relative">
             <img
               className="w-full h-full object-cover opacity-60"
               src={coverImage}
               alt="Map"
             />
             <div className="absolute inset-0 flex items-center justify-center">
                 <button
                   className="bg-white/90 backdrop-blur text-on-surface px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 hover:bg-white active:scale-95 transition-all"
                   onClick={handleOpenMapRoute}
                 >
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
