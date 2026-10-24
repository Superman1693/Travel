import axios, { AxiosInstance, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/network';
import { clearAuthState, redirectToLoginForUnauthorized } from '../utils/auth';
import { readLocationCache } from '../utils/location';

// 修复 E49：收窄敏感错误匹配规则。原规则（/sql/i、/syntax/i、/com\./i 等）过于宽泛，
// 会误杀正常业务提示（例如「语法有误，请检查输入」）。这里只匹配明确的技术栈泄露特征。
const SENSITIVE_ERROR_PATTERNS: RegExp[] = [
    /bad\s+sql\s+grammar/i,
    /\bSQLSyntaxErrorException\b/,
    /\bSQLException\b/,
    /\bNullPointerException\b/,
    /\bjava\.[a-z]+\./i,
    /\borg\.springframework\b/i,
    /\bcom\.ahead\./i,
    /\bat\s+[\w.$]+\([\w.]+\.java:\d+\)/,
];

const toSafeErrorMessage = (message?: string, description?: string): string => {
    const candidate = (description || message || '').trim();
    if (!candidate) {
        return '请求失败，请稍后重试';
    }

    const isSensitive = SENSITIVE_ERROR_PATTERNS.some((pattern) => pattern.test(candidate));
    if (isSensitive) {
        return '服务异常，请稍后重试';
    }

    return candidate;
};

const normalizeToken = (rawToken: string | null): string | null => {
    if (!rawToken) {
        return null;
    }

    const trimmed = rawToken.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
        return null;
    }

    return trimmed.replace(/^Bearer\s+/i, '');
};

const encodeHeaderValue = (value: string): string => {
    try {
        return encodeURIComponent(value);
    } catch {
        return '';
    }
};

// 创建 axios 实例
const axiosInstance: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器 - 添加 token
axiosInstance.interceptors.request.use(
    (config) => {
        const token = normalizeToken(localStorage.getItem('token'));
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        const location = readLocationCache();
        if (location) {
            config.headers['X-User-Location'] = encodeHeaderValue(location.queryText);
            config.headers['X-User-Location-Display'] = encodeHeaderValue(location.displayText);
            config.headers['X-User-Latitude'] = String(location.latitude);
            config.headers['X-User-Longitude'] = String(location.longitude);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 处理错误
axiosInstance.interceptors.response.use(
    (response) => {
        const { code, data, message, description } = response.data;
        const safeMessage = toSafeErrorMessage(message, description);

        // token 过期
        if (code === 40100) {
            const hasToken = Boolean(normalizeToken(localStorage.getItem('token')));
            clearAuthState();
            // 仅在已有登录态失效时才强制回到登录页，游客浏览不做硬跳转；
            // 携带当前 hash 路径作为 redirect，登录成功后回跳
            if (hasToken) {
                redirectToLoginForUnauthorized();
            }
            return Promise.reject(new Error(safeMessage));
        }

        // 其他错误
        if (code !== 0) {
            return Promise.reject(new Error(safeMessage));
        }

        return data;
    },
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

/**
 * 修复 E46：拦截器已把响应体解包为 data，因此对外暴露的客户端类型应为 Promise<T>，
 * 而不是 axios 原生的 Promise<AxiosResponse<T>>，使类型声明与运行时行为一致。
 */
export interface ApiClient {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

export default axiosInstance as unknown as ApiClient;
