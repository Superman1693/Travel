import axios, { AxiosInstance } from 'axios';

const SENSITIVE_ERROR_PATTERNS: RegExp[] = [
    /sql/i,
    /syntax/i,
    /exception/i,
    /stack/i,
    /mapper/i,
    /bad\s+sql\s+grammar/i,
    /java\./i,
    /org\./i,
    /com\./i,
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

// 创建 axios 实例
const api: AxiosInstance = axios.create({
    baseURL: 'http://localhost:8123/api',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器 - 添加 token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
    (response) => {
        const { code, data, message, description } = response.data;
        const safeMessage = toSafeErrorMessage(message, description);

        // token 过期
        if (code === 40100) {
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
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

export default api;
