export const normalizeToken = (rawToken: string | null | undefined): string => {
  if (!rawToken) {
    return '';
  }

  return rawToken.trim().replace(/^Bearer\s+/i, '');
};

export const hasValidToken = (): boolean => {
  return Boolean(normalizeToken(localStorage.getItem('token')));
};

export const buildLoginRedirectPath = (pathWithQuery: string): string => {
  return `/login?redirect=${encodeURIComponent(pathWithQuery)}`;
};

export const resolveRedirectAfterLogin = (search: string): string => {
  const redirect = new URLSearchParams(search).get('redirect') || '/';
  if (!redirect.startsWith('/')) {
    return '/';
  }
  return redirect;
};

// 清除本地登录态（token + 用户信息缓存）
export const clearAuthState = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
};

// 401 统一跳转：携带当前 hash 路径，登录成功后由 Login 页回跳
export const redirectToLoginForUnauthorized = (): void => {
  const currentPath = window.location.hash.slice(1) || '/';
  window.location.replace(
    `${window.location.origin}/#/login?redirect=${encodeURIComponent(currentPath)}`
  );
};

// 读取本地缓存的用户信息（登录成功时由 Login 页写入 result.user）
export const readStoredUserInfo = (): { id?: number; username?: string } | null => {
  const raw = localStorage.getItem('userInfo');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { id?: number; username?: string };
  } catch {
    return null;
  }
};

// 解析当前用户标识：优先 id，其次 username，未登录（或无可用字段）回退 guest
export const getSessionUserScope = (): string => {
  const info = readStoredUserInfo();
  if (!info) {
    return 'guest';
  }
  if (info.id !== undefined && info.id !== null) {
    return String(info.id);
  }
  if (info.username) {
    return info.username;
  }
  return 'guest';
};

// 按用户隔离的本地存储 key，避免多账号会话串数据
export const buildUserScopedStorageKey = (baseKey: string): string => {
  return `${baseKey}:${getSessionUserScope()}`;
};
