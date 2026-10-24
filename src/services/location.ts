import api from './api';

export interface ResolvedLocation {
  displayText: string;
  queryText: string;
  province: string;
  city: string;
  district?: string;
  adcode?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  source: string;
}

export const resolveLocationByCoordinates = (
  latitude: number,
  longitude: number
): Promise<ResolvedLocation> => {
  return api.get('/location/reverse', { params: { latitude, longitude } });
};

// 修复 E45/O19：天气查询改由后端代理，前端不再直连 open-meteo
export interface WeatherInfo {
  temperature: number;
  weatherCode: number;
  minTemperature?: number;
  maxTemperature?: number;
  targetDate?: string;
}

export const getWeather = (city: string, date?: string): Promise<WeatherInfo> => {
  return api.get('/location/weather', { params: { city, date } });
};
