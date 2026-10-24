import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addPlace,
  createItinerary,
  deleteItinerary,
  deletePlace,
  getHotRecommendationsByLocation,
  getItineraryDetail,
  getItineraryList,
  getWeather,
  updateItinerary,
  type AddPlaceRequest,
  type Itinerary,
  type ItineraryDay,
  type ItineraryDetail,
  type ItineraryPlace,
  updatePlace,
} from '../services';

type PlaceType = 'attraction' | 'restaurant' | 'hotel';

interface PlaceFormState {
  dayNumber: number;
  time: string;
  name: string;
  type: PlaceType;
  imageUrl: string;
  distance: string;
  duration: string;
  tagsText: string;
}

interface ItineraryFormState {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
}

const PLACE_TYPE_OPTIONS: Array<{ label: string; value: PlaceType }> = [
  { label: '景点', value: 'attraction' },
  { label: '餐饮', value: 'restaurant' },
  { label: '酒店', value: 'hotel' },
];

const EMPTY_PLACE_FORM: PlaceFormState = {
  dayNumber: 1,
  time: '09:00',
  name: '',
  type: 'attraction',
  imageUrl: '',
  distance: '',
  duration: '',
  tagsText: '',
};

const EMPTY_ITINERARY_FORM: ItineraryFormState = {
  title: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelers: 2,
};

const formatDateLabel = (date: string) => {
  if (!date) return '-';
  return date;
};

const toTagArray = (raw: string) => raw
  .split(/[，,]/)
  .map((tag) => tag.trim())
  .filter(Boolean);

const sortByTime = (places: ItineraryPlace[]) => [...places].sort((a, b) => a.time.localeCompare(b.time));

const buildPlacePayload = (form: PlaceFormState): AddPlaceRequest => ({
  dayNumber: Number(form.dayNumber),
  time: form.time,
  name: form.name.trim(),
  type: form.type,
  imageUrl: form.imageUrl.trim() || undefined,
  distance: form.distance.trim() || undefined,
  duration: form.duration.trim() || undefined,
  tags: toTagArray(form.tagsText),
});

const getPlaceTypeLabel = (type: PlaceType) => {
  const hit = PLACE_TYPE_OPTIONS.find((item) => item.value === type);
  return hit ? hit.label : type;
};

const getPlaceTypeIcon = (type: PlaceType) => {
  if (type === 'restaurant') return 'restaurant';
  if (type === 'hotel') return 'hotel';
  return 'park';
};

const getPlaceTypeAccent = (type: PlaceType) => {
  if (type === 'restaurant') return 'border-[#ff9817] bg-[#fff4e7]';
  if (type === 'hotel') return 'border-[#6c9fff] bg-[#eef4ff]';
  return 'border-[#7ad29b] bg-[#eefaf2]';
};

const DAY_PLACE_FALLBACK_PRICE: Record<PlaceType, number> = {
  attraction: 120,
  restaurant: 90,
  hotel: 380,
};

const normalizeText = (text: string) => text
  .toLowerCase()
  .replace(/[\s·、，。,.!！?？()（）\-]/g, '');

const findMatchedPrice = (
  placeName: string,
  priceCatalog: Array<{ title: string; price: number }>
): number | null => {
  const normalizedPlaceName = normalizeText(placeName);
  if (!normalizedPlaceName) return null;

  let bestScore = 0;
  let matchedPrice: number | null = null;

  for (const item of priceCatalog) {
    const normalizedTitle = normalizeText(item.title);
    if (!normalizedTitle) continue;

    if (normalizedPlaceName === normalizedTitle) {
      return item.price;
    }

    if (
      normalizedPlaceName.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedPlaceName)
    ) {
      const score = Math.min(normalizedPlaceName.length, normalizedTitle.length);
      if (score > bestScore) {
        bestScore = score;
        matchedPrice = item.price;
      }
    }
  }

  return matchedPrice;
};

const WEATHER_CODE_LABEL: Record<number, string> = {
  0: '晴',
  1: '晴间多云',
  2: '局部多云',
  3: '阴',
  45: '有雾',
  48: '雾凇',
  51: '小毛雨',
  53: '毛雨',
  55: '大毛雨',
  56: '冻毛雨',
  57: '强冻毛雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '阵雨',
  81: '强阵雨',
  82: '暴雨',
  85: '阵雪',
  86: '强阵雪',
  95: '雷暴',
  96: '雷暴夹冰雹',
  99: '强雷暴夹冰雹',
};

interface WeatherInfo {
  temperature: number;
  weatherCode: number;
  minTemperature?: number;
  maxTemperature?: number;
  targetDate?: string;
}

const fetchWeatherByCity = async (city: string, targetDate?: string): Promise<WeatherInfo | null> => {
  const keyword = city.trim();
  if (!keyword) return null;

  try {
    // 修复 E45/O19：改为调用后端代理接口，不再由浏览器直连 open-meteo，
    // 统一走后端鉴权/限流/缓存，也避免暴露用户 IP 与依赖第三方 CORS。
    const result = await getWeather(keyword, targetDate);
    if (!result || !Number.isFinite(result.temperature) || !Number.isFinite(result.weatherCode)) {
      return null;
    }
    return {
      temperature: result.temperature,
      weatherCode: result.weatherCode,
      minTemperature: result.minTemperature,
      maxTemperature: result.maxTemperature,
      targetDate: result.targetDate ?? targetDate,
    };
  } catch {
    return null;
  }
};

export default function Itinerary() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [currentItineraryId, setCurrentItineraryId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ItineraryDetail | null>(null);
  const [activeDay, setActiveDay] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [itineraryForm, setItineraryForm] = useState<ItineraryFormState>(EMPTY_ITINERARY_FORM);
  const [showCreateItinerary, setShowCreateItinerary] = useState(false);
  const [editingItineraryId, setEditingItineraryId] = useState<number | null>(null);
  const [showPlaceEditor, setShowPlaceEditor] = useState(false);

  const [placeForm, setPlaceForm] = useState<PlaceFormState>(EMPTY_PLACE_FORM);
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [priceCatalog, setPriceCatalog] = useState<Array<{ title: string; price: number }>>([]);

  const loadDetail = async (id: number) => {
    const data = await getItineraryDetail(id);
    const normalizedDays = (data.days || []).map((day) => ({
      ...day,
      places: sortByTime(day.places || []),
    }));
    setDetail({ ...data, days: normalizedDays });
    const firstFilledDay = normalizedDays.find((day) => (day.places?.length || 0) > 0)?.dayNumber;
    const firstDay = firstFilledDay || normalizedDays[0]?.dayNumber || 1;
    setActiveDay(firstDay);
    setPlaceForm((prev) => ({ ...prev, dayNumber: firstDay }));
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getItineraryList();
      setItineraries(list || []);
      if (list?.length) {
        const targetId = list[0].id;
        setCurrentItineraryId(targetId);
        await loadDetail(targetId);
      } else {
        setCurrentItineraryId(null);
        setDetail(null);
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : '加载行程失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const days = useMemo(() => detail?.days || [], [detail]);
  const activeDayData = useMemo(
    () => days.find((day) => day.dayNumber === activeDay) || null,
    [activeDay, days]
  );

  const resetPlaceForm = (dayNumber: number) => {
    setPlaceForm({ ...EMPTY_PLACE_FORM, dayNumber, time: '09:00' });
    setEditingPlaceId(null);
  };

  const handleSwitchItinerary = async (id: number) => {
    if (id === currentItineraryId) return;
    setCurrentItineraryId(id);
    setError('');
    try {
      await loadDetail(id);
      resetPlaceForm(1);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : '加载行程详情失败';
      setError(message);
    }
  };

  const handleCreateItinerary = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!itineraryForm.title.trim() || !itineraryForm.destination.trim()) {
      setError('请填写行程标题和目的地');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (editingItineraryId) {
        const updated = await updateItinerary(editingItineraryId, {
          title: itineraryForm.title.trim(),
          destination: itineraryForm.destination.trim(),
          startDate: itineraryForm.startDate,
          endDate: itineraryForm.endDate,
          travelers: Number(itineraryForm.travelers),
        });

        setItineraries((prev) => prev.map((item) => (item.id === editingItineraryId ? { ...item, ...updated } : item)));
        setCurrentItineraryId(updated.id);
        await loadDetail(updated.id);
      } else {
        const created = await createItinerary({
          title: itineraryForm.title.trim(),
          destination: itineraryForm.destination.trim(),
          startDate: itineraryForm.startDate,
          endDate: itineraryForm.endDate,
          travelers: Number(itineraryForm.travelers),
        });

        const nextList = [created, ...itineraries];
        setItineraries(nextList);
        setCurrentItineraryId(created.id);
        await loadDetail(created.id);
      }

      setEditingItineraryId(null);
      setShowCreateItinerary(false);
      setItineraryForm(EMPTY_ITINERARY_FORM);
    } catch (createError) {
      const message = createError instanceof Error
        ? createError.message
        : editingItineraryId
          ? '更新行程失败'
          : '创建行程失败';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditItinerary = (item: Itinerary) => {
    setShowCreateItinerary(true);
    setEditingItineraryId(item.id);
    setItineraryForm({
      title: item.title || '',
      destination: item.destination || '',
      startDate: item.startDate || '',
      endDate: item.endDate || '',
      travelers: item.travelers || 1,
    });
  };

  const handleDeleteItinerary = async (id: number) => {
    const confirmed = window.confirm('确认删除这个行程吗？删除后不可恢复。');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await deleteItinerary(id);

      const nextList = itineraries.filter((item) => item.id !== id);
      setItineraries(nextList);

      if (currentItineraryId === id) {
        if (nextList.length > 0) {
          const nextId = nextList[0].id;
          setCurrentItineraryId(nextId);
          await loadDetail(nextId);
        } else {
          setCurrentItineraryId(null);
          setDetail(null);
          setActiveDay(1);
        }
      }

      if (editingItineraryId === id) {
        setEditingItineraryId(null);
        setShowCreateItinerary(false);
        setItineraryForm(EMPTY_ITINERARY_FORM);
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : '删除行程失败';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlace = (dayNumber: number, place: ItineraryPlace) => {
    setActiveDay(dayNumber);
    setShowPlaceEditor(true);
    setEditingPlaceId(place.id);
    setPlaceForm({
      dayNumber,
      time: place.time,
      name: place.name,
      type: place.type,
      imageUrl: place.imageUrl || '',
      distance: place.distance || '',
      duration: place.duration || '',
      tagsText: (place.tags || []).join(', '),
    });
  };

  const refreshCurrentDetail = async () => {
    if (!currentItineraryId) return;
    await loadDetail(currentItineraryId);
  };

  const handleSavePlace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentItineraryId) {
      setError('请先创建或选择一个行程');
      return;
    }
    if (!placeForm.name.trim()) {
      setError('请填写地点名称');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = buildPlacePayload(placeForm);
      if (editingPlaceId) {
        await updatePlace(editingPlaceId, payload);
      } else {
        await addPlace(currentItineraryId, payload);
      }

      await refreshCurrentDetail();
      resetPlaceForm(placeForm.dayNumber);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : '保存行程项失败';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlace = async (placeId: number) => {
    const confirmed = window.confirm('确认删除该行程项吗？');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    try {
      await deletePlace(placeId);
      await refreshCurrentDetail();
      if (editingPlaceId === placeId) {
        resetPlaceForm(activeDay);
      }
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : '删除行程项失败';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectDay = (day: ItineraryDay) => {
    setActiveDay(day.dayNumber);
    if (!editingPlaceId) {
      setPlaceForm((prev) => ({ ...prev, dayNumber: day.dayNumber }));
    }
  };

  const budgetBreakdown = useMemo(() => {
    const places = activeDayData?.places || [];
    const travelers = detail?.travelers || 1;

    if (!places.length) {
      return {
        total: 0,
        matchedCount: 0,
        fallbackCount: 0,
        placeCount: 0,
      };
    }

    let perPersonTotal = 0;
    let matchedCount = 0;
    let fallbackCount = 0;

    for (const place of places) {
      const matchedPrice = findMatchedPrice(place.name, priceCatalog);
      if (matchedPrice !== null) {
        perPersonTotal += matchedPrice;
        matchedCount += 1;
      } else {
        perPersonTotal += DAY_PLACE_FALLBACK_PRICE[place.type as PlaceType] || 120;
        fallbackCount += 1;
      }
    }

    return {
      total: Math.round(perPersonTotal * travelers),
      matchedCount,
      fallbackCount,
      placeCount: places.length,
    };
  }, [activeDayData, detail?.travelers, priceCatalog]);

  const estimatedBudget = budgetBreakdown.total;

  const weatherText = useMemo(() => {
    if (!detail?.destination) return '暂无天气数据';
    if (weatherLoading) return `${detail.destination} · 天气加载中...`;
    if (!weatherInfo) return `${detail.destination} · 暂无天气数据`;
    const label = WEATHER_CODE_LABEL[weatherInfo.weatherCode] || '天气未知';
    if (Number.isFinite(weatherInfo.minTemperature) && Number.isFinite(weatherInfo.maxTemperature)) {
      return `${detail.destination} · ${label} ${Math.round(weatherInfo.minTemperature || 0)}-${Math.round(weatherInfo.maxTemperature || 0)}°C`;
    }
    return `${detail.destination} · ${Math.round(weatherInfo.temperature)}°C ${label}`;
  }, [detail, weatherInfo, weatherLoading]);

  const budgetText = useMemo(() => {
    if (budgetLoading) return '预算加载中...';
    if (!budgetBreakdown.placeCount) return '当天暂无行程点位';
    if (budgetBreakdown.matchedCount === 0) {
      return `当天${budgetBreakdown.placeCount}个点位暂无匹配价格，按类型估算`;
    }
    if (budgetBreakdown.fallbackCount === 0) {
      return `当天${budgetBreakdown.placeCount}个点位均为匹配到的真实价格`;
    }
    return `当天${budgetBreakdown.placeCount}个点位：${budgetBreakdown.matchedCount}个真实价格，${budgetBreakdown.fallbackCount}个类型估算`;
  }, [budgetBreakdown, budgetLoading]);

  useEffect(() => {
    const destination = detail?.destination?.trim();
    const dayDate = activeDayData?.date;
    if (!destination) {
      setWeatherInfo(null);
      setPriceCatalog([]);
      return;
    }

    let cancelled = false;

    const loadExternalData = async () => {
      setWeatherLoading(true);
      setBudgetLoading(true);

      try {
        const [weatherResult, recommendationResult] = await Promise.allSettled([
          fetchWeatherByCity(destination, dayDate),
          getHotRecommendationsByLocation(destination, 1, 20),
        ]);

        if (!cancelled) {
          if (weatherResult.status === 'fulfilled') {
            setWeatherInfo(weatherResult.value);
          } else {
            setWeatherInfo(null);
          }

          if (recommendationResult.status === 'fulfilled') {
            const catalog = (recommendationResult.value?.list || [])
              .map((item) => ({
                title: item.title,
                price: Number(item.price),
              }))
              .filter((item) => item.title && Number.isFinite(item.price) && item.price > 0);
            setPriceCatalog(catalog);
          } else {
            setPriceCatalog([]);
          }
        }
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
          setBudgetLoading(false);
        }
      }
    };

    loadExternalData();

    return () => {
      cancelled = true;
    };
  }, [detail?.destination, activeDayData?.date]);

  return (
    <main className="font-body text-on-surface antialiased bg-surface min-h-screen pb-24">
      <section className="px-5 pt-6 space-y-5">
        <header className="rounded-3xl bg-[#dfe4ff] p-5 shadow-[0_8px_24px_rgba(86,98,156,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-[#5d688f] font-semibold">我的行程</p>
              <h1 className="text-xl font-black text-[#1f2b57] mt-1">{detail?.title || '行程规划中'}</h1>
              <p className="text-xs text-[#6f7aa8] mt-1">
                {detail ? `${formatDateLabel(detail.startDate)} - ${formatDateLabel(detail.endDate)} · ${detail.travelers}人` : '创建后即可开始规划'}
              </p>
            </div>
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-white/70 text-[#445184] flex items-center justify-center"
              onClick={() => {
                setEditingItineraryId(null);
                setItineraryForm(EMPTY_ITINERARY_FORM);
                setShowCreateItinerary((prev) => !prev);
              }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>

          {showCreateItinerary && (
            <form className="mt-4 grid grid-cols-1 gap-2" onSubmit={handleCreateItinerary}>
              <input
                className="rounded-xl border border-[#c8cfef] px-3 py-2 text-sm bg-white"
                placeholder="行程标题"
                value={itineraryForm.title}
                onChange={(e) => setItineraryForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <input
                className="rounded-xl border border-[#c8cfef] px-3 py-2 text-sm bg-white"
                placeholder="目的地"
                value={itineraryForm.destination}
                onChange={(e) => setItineraryForm((prev) => ({ ...prev, destination: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  className="rounded-xl border border-[#c8cfef] px-3 py-2 text-sm bg-white"
                  value={itineraryForm.startDate}
                  onChange={(e) => setItineraryForm((prev) => ({ ...prev, startDate: e.target.value }))}
                />
                <input
                  type="date"
                  className="rounded-xl border border-[#c8cfef] px-3 py-2 text-sm bg-white"
                  value={itineraryForm.endDate}
                  onChange={(e) => setItineraryForm((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-[#3e6dd8] text-white text-sm font-bold py-2.5 disabled:opacity-60"
                disabled={saving}
              >
                {saving ? '提交中...' : editingItineraryId ? '保存修改' : '确认创建'}
              </button>
              {editingItineraryId && (
                <button
                  type="button"
                  className="rounded-xl bg-white text-[#3e6dd8] text-sm font-bold py-2.5 border border-[#b8c7f3]"
                  onClick={() => {
                    setEditingItineraryId(null);
                    setShowCreateItinerary(false);
                    setItineraryForm(EMPTY_ITINERARY_FORM);
                  }}
                >
                  取消编辑
                </button>
              )}
            </form>
          )}
        </header>

        {error && <div className="rounded-xl bg-error/10 text-error px-4 py-2.5 text-sm">{error}</div>}

        <section className="rounded-2xl bg-[#eef1ff] p-2 border border-[#d8def7]">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h2 className="text-xs font-bold text-[#5a668f]">行程列表</h2>
            <span className="text-[11px] text-[#7d88b3]">{itineraries.length} 个</span>
          </div>
          {loading ? (
            <p className="text-xs text-[#7d88b3] px-2 py-1">加载中...</p>
          ) : itineraries.length === 0 ? (
            <p className="text-xs text-[#7d88b3] px-2 py-1">暂无行程</p>
          ) : (
            <div className="space-y-2">
              {itineraries.map((item) => (
                <div key={item.id} className={`rounded-xl px-2 py-2 border ${currentItineraryId === item.id ? 'border-[#89a9f6] bg-[#f0f5ff]' : 'border-[#d6dcf7] bg-white'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchItinerary(item.id)}
                      className={`text-left flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
                        currentItineraryId === item.id
                          ? 'text-[#2c4da8]'
                          : 'text-[#4c5887]'
                      }`}
                    >
                      <span className="block truncate">{item.title}</span>
                      <span className="block text-[10px] font-medium text-[#7d88b3] mt-0.5 truncate">{item.destination} · {item.startDate} ~ {item.endDate}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#e8eeff] text-[#2f57bd]"
                        onClick={() => handleStartEditItinerary(item)}
                        disabled={saving}
                      >
                        修改
                      </button>
                      <button
                        type="button"
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#ffe9e9] text-[#b63636] disabled:opacity-60"
                        onClick={() => handleDeleteItinerary(item.id)}
                        disabled={saving}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] bg-[#e8ebfb] p-2 flex gap-2 overflow-x-auto no-scrollbar items-center">
          {days.length === 0 && (
            <button className="min-w-[92px] h-12 px-4 rounded-2xl bg-white text-[#24305f] text-sm font-bold whitespace-nowrap">第一天</button>
          )}
          {days.map((day) => (
            <button
              key={day.dayNumber}
              type="button"
              onClick={() => handleSelectDay(day)}
              className={`min-w-[92px] h-12 px-4 rounded-2xl text-sm font-bold whitespace-nowrap flex items-center justify-center ${
                activeDay === day.dayNumber
                  ? 'bg-[#5d8bf2] text-white shadow-[0_8px_18px_rgba(69,118,224,0.35)]'
                  : 'bg-transparent text-[#4b5685]'
              }`}
            >
              第{day.dayNumber}天
            </button>
          ))}
        </section>

        {!!detail && (
          <section className="rounded-2xl border border-[#d8dff7] bg-white p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-[#24305f]">自定义行程规划</h3>
                <p className="text-xs text-[#7480ab] mt-0.5">支持手动添加自己的地点安排</p>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#2f66da] text-white"
                onClick={() => {
                  setShowPlaceEditor((prev) => !prev);
                  if (!showPlaceEditor) {
                    resetPlaceForm(activeDay);
                  }
                }}
              >
                {showPlaceEditor ? '收起编辑器' : '添加自定义行程'}
              </button>
            </div>

            {showPlaceEditor && (
              <form className="mt-3 grid grid-cols-1 gap-2" onSubmit={handleSavePlace}>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-bold text-[#5a668f]">
                    第几天
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                      value={placeForm.dayNumber}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, dayNumber: Number(e.target.value || 1) }))}
                    />
                  </label>
                  <label className="text-[11px] font-bold text-[#5a668f]">
                    时间
                    <input
                      type="time"
                      className="mt-1 w-full rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                      value={placeForm.time}
                      onChange={(e) => setPlaceForm((prev) => ({ ...prev, time: e.target.value }))}
                    />
                  </label>
                </div>

                <input
                  className="rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                  value={placeForm.name}
                  onChange={(e) => setPlaceForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="地点名称（例如：春熙路）"
                />

                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                    value={placeForm.type}
                    onChange={(e) => setPlaceForm((prev) => ({ ...prev, type: e.target.value as PlaceType }))}
                  >
                    {PLACE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <input
                    className="rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                    value={placeForm.duration}
                    onChange={(e) => setPlaceForm((prev) => ({ ...prev, duration: e.target.value }))}
                    placeholder="建议时长（如2h）"
                  />
                </div>

                <input
                  className="rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                  value={placeForm.distance}
                  onChange={(e) => setPlaceForm((prev) => ({ ...prev, distance: e.target.value }))}
                  placeholder="距离/路线信息"
                />

                <input
                  className="rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                  value={placeForm.tagsText}
                  onChange={(e) => setPlaceForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                  placeholder="标签（逗号分隔）"
                />

                <input
                  className="rounded-xl border border-[#cdd6f4] px-3 py-2 text-sm"
                  value={placeForm.imageUrl}
                  onChange={(e) => setPlaceForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="图片链接（可选）"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[#2f66da] text-white text-sm font-bold py-2.5 disabled:opacity-60"
                    disabled={saving}
                  >
                    {saving ? '保存中...' : editingPlaceId ? '保存修改' : '添加到当天行程'}
                  </button>
                  {editingPlaceId && (
                    <button
                      type="button"
                      className="rounded-xl bg-white text-[#2f66da] text-sm font-bold py-2.5 border border-[#b8c7f3]"
                      onClick={() => resetPlaceForm(activeDay)}
                    >
                      取消编辑
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        )}

        <section className="space-y-5">
          {!activeDayData || activeDayData.places.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#c8cfef] bg-[#f6f7ff] p-5 text-sm text-[#616c97]">
              这一天还没有安排地点，先去详情页点“加入我的行程”吧。
            </div>
          ) : (
            activeDayData.places.map((place, index) => (
              <article key={place.id} className="relative pl-10">
                <div className={`absolute left-[9px] top-0 ${index === activeDayData.places.length - 1 ? 'h-3' : 'h-[calc(100%+22px)]'} w-[2px] bg-[#c5ceef]`} />
                <div className="absolute left-0 top-2 w-5 h-5 rounded-full bg-[#1d65d8] border-4 border-[#dbe3ff]" />

                <div className="mb-2">
                  <p className="text-xl font-black text-[#2a3562] tracking-tight">{place.time || '09:00'}</p>
                  <p className="text-xs text-[#8a93b6]">建议时长: {place.duration || '2h'}</p>
                </div>

                <div className="rounded-2xl bg-[#f7f8ff] border border-[#d8dff7] p-3.5 shadow-[0_8px_20px_rgba(82,95,151,0.12)]">
                  {place.imageUrl && place.type !== 'restaurant' && (
                    <img
                      src={place.imageUrl}
                      alt={place.name}
                      className="w-full h-32 object-cover rounded-xl mb-3"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-black text-[#1f2b57] leading-tight">{place.name}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-bold text-[#3a4d86] ${getPlaceTypeAccent(place.type)}`}>
                      {getPlaceTypeLabel(place.type)}
                    </span>
                  </div>

                  <p className="text-sm text-[#59648f] mt-2 leading-relaxed">
                    {place.distance || '行程亮点地点，建议提前查看开放时间。'}
                  </p>

                  {!!place.tags?.length && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {place.tags.map((tag) => (
                        <span key={`${place.id}-${tag}`} className="text-[11px] px-2 py-1 rounded-full bg-[#e7ebff] text-[#5d6c9c] font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-xs text-[#6471a1]">
                    <span className="material-symbols-outlined text-[16px]">{getPlaceTypeIcon(place.type)}</span>
                    <span>{place.duration || '2h'} · {place.distance || '路线待补充'}</span>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleEditPlace(activeDayData.dayNumber, place)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#e8eeff] text-[#2f57bd]"
                      disabled={saving}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlace(place.id)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#ffe9e9] text-[#b63636] disabled:opacity-60 ml-2"
                      disabled={saving}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="space-y-3 pb-6">
          <div className="rounded-2xl bg-[#dde4ff] px-4 py-3.5 border border-[#c6d0f6]">
            <span className="material-symbols-outlined text-[#2d68d8] text-2xl">map</span>
            <h4 className="text-2xl font-black text-[#1f2b57] mt-2">地图视图</h4>
            <p className="text-xs text-[#6f7aa8] mt-0.5">查看今日行程路线图</p>
          </div>

          <div className="rounded-2xl bg-[#e7eef2] px-4 py-3.5 border border-[#d5dde4]">
            <span className="material-symbols-outlined text-[#198754] text-2xl">cloud</span>
            <h4 className="text-2xl font-black text-[#1f2b57] mt-2">天气预报</h4>
            <p className="text-xs text-[#6f7a89] mt-0.5">{weatherText}</p>
          </div>

          <div className="rounded-2xl bg-[#ece7ea] px-4 py-3.5 border border-[#dfd4da]">
            <span className="material-symbols-outlined text-[#8d4a0f] text-2xl">wallet</span>
            <h4 className="text-2xl font-black text-[#1f2b57] mt-2">预算概览</h4>
            <p className="text-xs text-[#756b75] mt-0.5">{budgetText}</p>
            <p className="text-xs text-[#756b75] mt-1">今日预计支出：¥{estimatedBudget.toLocaleString()}</p>
          </div>
        </section>

        <div className="rounded-3xl p-3.5 border border-[#c7d5ff] bg-[linear-gradient(120deg,#edf2ff_0%,#e7f0ff_46%,#f3f7ff_100%)] shadow-[0_8px_20px_rgba(85,110,172,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-[#2f66da] w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_6px_14px_rgba(47,102,218,0.35)]">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <h4 className="font-black text-sm text-[#202c5b] whitespace-nowrap">AI 行程管家</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#dbe8ff] text-[#3f5ea7] font-bold whitespace-nowrap">在线</span>
              </div>
            </div>
            <Link to="/chat" className="shrink-0 bg-[#2f66da] text-white text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform shadow-[0_6px_12px_rgba(47,102,218,0.32)]">立即对话</Link>
          </div>
          <p className="text-xs text-[#59638d] mt-2 pl-12">告诉我偏好，我来补全路线、时间与预算建议。</p>
        </div>
      </section>
    </main>
  );
}
