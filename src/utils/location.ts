export const LOCATION_CACHE_KEY = 'travel.home.location';
const LOCATION_CACHE_TTL = 24 * 60 * 60 * 1000;

export interface LocationCacheData {
  displayText: string;
  queryText: string;
  province?: string;
  city?: string;
  latitude: number;
  longitude: number;
  updatedAt: number;
}

const toStringOrUndefined = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
};

export const readLocationCache = (): LocationCacheData | null => {
  const raw = localStorage.getItem(LOCATION_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocationCacheData> & { cityText?: string };
    const displayText = toStringOrUndefined(parsed.displayText) || toStringOrUndefined(parsed.cityText);
    const queryText = toStringOrUndefined(parsed.queryText) || displayText;

    if (
      !displayText ||
      !queryText ||
      typeof parsed.latitude !== 'number' ||
      typeof parsed.longitude !== 'number' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }

    if (Date.now() - parsed.updatedAt > LOCATION_CACHE_TTL) {
      return null;
    }

    return {
      displayText,
      queryText,
      province: toStringOrUndefined(parsed.province),
      city: toStringOrUndefined(parsed.city),
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
};

export const writeLocationCache = (payload: LocationCacheData) => {
  localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(payload));
};
