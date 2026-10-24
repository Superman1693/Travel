const normalizeUrl = (value: string): string => value.replace(/\/+$/, '');

// 修复 E44：默认值改为本地开发地址，避免环境变量缺失时静默连到生产域名。
// 生产构建请在 .env / CI 中显式设置 VITE_API_BASE_URL。
const defaultApiBaseUrl = 'http://localhost:8123/api';

export const API_BASE_URL = normalizeUrl(import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl);

const inferredBackendOrigin = API_BASE_URL.replace(/\/api$/i, '');

export const BACKEND_ORIGIN = normalizeUrl(import.meta.env.VITE_BACKEND_ORIGIN || inferredBackendOrigin);
