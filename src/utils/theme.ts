export type ThemeMode = 'system' | 'light' | 'dark';
export type Language = 'zh-CN' | 'en-US';

export interface LocalPreferences {
  notificationsEnabled: boolean;
  language: Language;
  themeMode: ThemeMode;
}

export const PREFERENCES_STORAGE_KEY = 'travel.settings.preferences';

export const DEFAULT_PREFERENCES: LocalPreferences = {
  notificationsEnabled: true,
  language: 'zh-CN',
  themeMode: 'system',
};

let systemMediaQuery: MediaQueryList | null = null;
let systemThemeListener: (() => void) | null = null;

const setResolvedTheme = (resolvedTheme: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.setAttribute('data-theme', resolvedTheme);
};

const removeSystemThemeListener = () => {
  if (!systemMediaQuery || !systemThemeListener) {
    return;
  }

  if (typeof systemMediaQuery.removeEventListener === 'function') {
    systemMediaQuery.removeEventListener('change', systemThemeListener);
  } else {
    systemMediaQuery.removeListener(systemThemeListener);
  }

  systemMediaQuery = null;
  systemThemeListener = null;
};

export const readPreferences = (): LocalPreferences => {
  const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalPreferences>;
    return {
      notificationsEnabled:
        typeof parsed.notificationsEnabled === 'boolean'
          ? parsed.notificationsEnabled
          : DEFAULT_PREFERENCES.notificationsEnabled,
      language:
        parsed.language === 'en-US' || parsed.language === 'zh-CN'
          ? parsed.language
          : DEFAULT_PREFERENCES.language,
      themeMode:
        parsed.themeMode === 'dark' || parsed.themeMode === 'light' || parsed.themeMode === 'system'
          ? parsed.themeMode
          : DEFAULT_PREFERENCES.themeMode,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const writePreferences = (preferences: LocalPreferences) => {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
};

export const applyThemeMode = (themeMode: ThemeMode) => {
  removeSystemThemeListener();

  if (themeMode === 'system') {
    if (typeof window.matchMedia !== 'function') {
      setResolvedTheme('light');
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => {
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    syncSystemTheme();
    systemMediaQuery = mediaQuery;
    systemThemeListener = syncSystemTheme;

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncSystemTheme);
    } else {
      mediaQuery.addListener(syncSystemTheme);
    }
    return;
  }

  setResolvedTheme(themeMode);
};

export const initThemeModeFromStorage = () => {
  const currentPreferences = readPreferences();
  applyThemeMode(currentPreferences.themeMode);
};
