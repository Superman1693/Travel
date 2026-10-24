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
