// 行程路线地图组件：基于高德 AMap JS API 2.0
// - key 来自 VITE_AMAP_JS_KEY，安全密钥来自 VITE_AMAP_SECURITY_CODE（加载 script 前挂到 window._AMapSecurityConfig）
// - 未配置 key 时调用方不应渲染本组件（优雅降级）
// - 地点无坐标：用 AMap.Geocoder 按地点名逐个正向地理编码（失败跳过），按 day 顺序连线画路线，每天一色
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ItineraryDay } from '../services';

// —— AMap 最小类型声明（官方无 TS 类型，仅覆盖本组件用到的能力）——
interface AMapLngLat {
    getLng(): number;
    getLat(): number;
}

interface AMapGeocoder {
    getLocation(
        keyword: string,
        callback: (status: string, result: { geocodes?: Array<{ location?: AMapLngLat | null }> }) => void
    ): void;
}

interface AMapMap {
    add(overlay: unknown): void;
    setFitView(overlays?: unknown[], immediately?: boolean): void;
    destroy(): void;
}

interface AMapNamespace {
    Map: new (container: HTMLElement, options: Record<string, unknown>) => AMapMap;
    Geocoder: new (options: Record<string, unknown>) => AMapGeocoder;
    Marker: new (options: Record<string, unknown>) => unknown;
    Polyline: new (options: Record<string, unknown>) => unknown;
}

declare global {
    interface Window {
        AMap?: AMapNamespace;
        _AMapSecurityConfig?: { securityJsCode: string };
    }
}

const AMAP_KEY = (import.meta.env.VITE_AMAP_JS_KEY as string | undefined)?.trim() || '';
const AMAP_SECURITY_CODE = (import.meta.env.VITE_AMAP_SECURITY_CODE as string | undefined)?.trim() || '';

// 对外暴露：是否配置了高德 key（未配置时页面不渲染地图区块）
export const hasAmapKey = (): boolean => Boolean(AMAP_KEY);

// 每天一条路线的颜色（简洁调色板，循环使用）
const DAY_COLORS = ['#2f66da', '#e2582f', '#0f9d58', '#9333ea', '#d97706', '#0891b2', '#be185d', '#4d7c0f'];

interface LngLatValue {
    lng: number;
    lat: number;
}

// script 动态注入一次（多实例/重复挂载共享同一个加载 Promise）
let amapLoadPromise: Promise<AMapNamespace> | null = null;

const loadAMap = (): Promise<AMapNamespace> => {
    if (window.AMap) {
        return Promise.resolve(window.AMap);
    }
    if (amapLoadPromise) {
        return amapLoadPromise;
    }

    amapLoadPromise = new Promise((resolve, reject) => {
        if (AMAP_SECURITY_CODE) {
            // 安全密钥必须在 script 加载前赋值，否则 2.0 版本校验失败
            window._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
        }

        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(AMAP_KEY)}&plugin=AMap.Geocoder`;
        script.async = true;
        script.onload = () => {
            if (window.AMap) {
                resolve(window.AMap);
            } else {
                reject(new Error('AMap 加载后命名空间缺失'));
            }
        };
        script.onerror = () => {
            amapLoadPromise = null; // 允许下次重试
            reject(new Error('AMap 脚本加载失败'));
        };
        document.head.appendChild(script);
    });

    return amapLoadPromise;
};

// 正向地理编码结果缓存（跨组件实例共享，同一关键词只请求一次）
const geocodeCache = new Map<string, LngLatValue | null>();

const geocodePlace = async (
    geocoder: AMapGeocoder,
    keyword: string,
    city?: string
): Promise<LngLatValue | null> => {
    const trimmed = keyword.trim();
    if (!trimmed) return null;

    const cacheKey = `${city || ''}|${trimmed}`;
    if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey) ?? null;
    }

    const location = await new Promise<LngLatValue | null>((resolve) => {
        geocoder.getLocation(trimmed, (status, result) => {
            if (status !== 'complete' || !result?.geocodes?.length) {
                resolve(null);
                return;
            }
            const location = result.geocodes[0]?.location;
            if (!location) {
                resolve(null);
                return;
            }
            resolve({ lng: location.getLng(), lat: location.getLat() });
        });
    });

    geocodeCache.set(cacheKey, location);
    return location;
};

interface ItineraryMapProps {
    days: ItineraryDay[];
    /** 目的地城市，用于提高地理编码精度（可选） */
    city?: string;
}

type MapStatus = 'loading' | 'ready' | 'error';

export default function ItineraryMap({ days, city }: ItineraryMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<MapStatus>('loading');
    const [failedCount, setFailedCount] = useState(0);

    // 地点签名：天数与地点集合变化时重绘（id + 名称即可）
    const signature = useMemo(
        () => days.map((day) => `${day.dayNumber}:${(day.places || []).map((p) => `${p.id}|${p.name}`).join(',')}`).join('||'),
        [days]
    );

    // 用 ref 读取最新 days：仅在 signature/city 变化时重绘，避免顺序调整等无关重渲染触发整图重建
    const daysRef = useRef(days);
    daysRef.current = days;

    useEffect(() => {
        let cancelled = false;
        let map: AMapMap | null = null;
        setStatus('loading');
        setFailedCount(0);

        const render = async () => {
            try {
                const AMap = await loadAMap();
                if (cancelled || !containerRef.current) return;

                map = new AMap.Map(containerRef.current, {
                    zoom: 11,
                    viewMode: '2D',
                });

                const currentDays = daysRef.current;
                const geocoder = new AMap.Geocoder(city ? { city } : {});
                const overlays: unknown[] = [];
                let failed = 0;

                for (let dayIndex = 0; dayIndex < currentDays.length; dayIndex += 1) {
                    const day = currentDays[dayIndex];
                    const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
                    const places = day.places || [];
                    const points: LngLatValue[] = [];

                    for (let i = 0; i < places.length; i += 1) {
                        const place = places[i];
                        const point = await geocodePlace(geocoder, place.name, city);
                        if (cancelled) return;
                        if (!point) {
                            failed += 1;
                            continue;
                        }
                        points.push(point);
                        overlays.push(
                            new AMap.Marker({
                                position: [point.lng, point.lat],
                                title: place.name,
                                label: {
                                    // 每个点带「第N天-序号」角标，一眼看出分组
                                    content: `<span style="display:inline-block;padding:1px 6px;border-radius:9999px;background:${color};color:#fff;font-size:11px;white-space:nowrap;">D${day.dayNumber}-${i + 1} ${place.name}</span>`,
                                    direction: 'top',
                                },
                            })
                        );
                    }

                    if (points.length >= 2) {
                        overlays.push(
                            new AMap.Polyline({
                                path: points.map((p) => [p.lng, p.lat]),
                                strokeColor: color,
                                strokeWeight: 5,
                                strokeOpacity: 0.9,
                                showDir: true,
                                lineJoin: 'round',
                            })
                        );
                    }
                }

                if (cancelled) return;

                if (overlays.length > 0) {
                    map.add(overlays);
                    map.setFitView(overlays, false);
                    setStatus('ready');
                } else {
                    // 一个点都没定位到：销毁空地图，页面展示提示态
                    map.destroy();
                    map = null;
                    setStatus('error');
                }
                setFailedCount(failed);
            } catch {
                if (!cancelled) {
                    setStatus('error');
                }
            }
        };

        render();

        return () => {
            cancelled = true;
            map?.destroy();
        };
        // signature 覆盖 days 内容变化；city 变化同样需要重编码
    }, [signature, city]);

    return (
        <div className="rounded-2xl border border-[#d8dff7] bg-white overflow-hidden">
            <div className="relative h-64 bg-[#eef1ff]">
                <div ref={containerRef} className="w-full h-full" />
                {status !== 'ready' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#eef1ff]">
                        <p className="text-xs text-[#6f7aa8]">
                            {status === 'loading' ? '地图路线加载中...' : '暂无法定位行程地点'}
                        </p>
                    </div>
                )}
            </div>
            <div className="px-4 py-2.5">
                <p className="text-xs text-[#6f7aa8]">
                    {failedCount > 0
                        ? `部分地点未定位成功（${failedCount} 个），已跳过`
                        : '按天连线展示行程路线，颜色区分不同日期'}
                </p>
            </div>
        </div>
    );
}
