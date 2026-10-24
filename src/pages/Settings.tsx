import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  applyThemeMode,
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type LocalPreferences,
} from '../utils/theme';

export default function Settings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [preferences, setPreferences] = useState<LocalPreferences>(() => readPreferences());
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'language' | 'theme' | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

  const languageLabel = preferences.language === 'zh-CN' ? '简体中文' : 'English';
  const themeLabel = useMemo(() => {
    if (preferences.themeMode === 'light') {
      return '浅色';
    }

    if (preferences.themeMode === 'dark') {
      return '深色';
    }

    return '跟随系统';
  }, [preferences.themeMode]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    writePreferences(preferences);
    applyThemeMode(preferences.themeMode);
    i18n.changeLanguage(preferences.language);
  }, [preferences, i18n]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    navigate('/login', { replace: true });
  };

  const handleResetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    setFeedback(t('settings.preferencesReset'));
  };

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen pb-12 flex flex-col">
      <header className="flex items-center px-4 py-4 bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant mr-2"
          aria-label="返回"
        >
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline text-on-surface">{t('settings.title')}</h1>
      </header>

      <div className="px-6 py-4 space-y-6">
        {feedback && (
          <section className="rounded-xl px-4 py-3 text-sm bg-secondary/10 text-secondary">
            {feedback}
          </section>
        )}

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">{t('settings.accountSecurity')}</h3>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low">
            <button
              type="button"
              onClick={() => navigate('/settings/personal-info')}
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low"
            >
              <span className="font-medium text-sm">{t('settings.personalInfo')}</span>
              <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings/account-security')}
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low"
            >
              <span className="font-medium text-sm">{t('settings.accountBinding')}</span>
              <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings/account-security')}
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left"
            >
              <span className="font-medium text-sm">{t('settings.changePassword')}</span>
              <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">{t('settings.preferences')}</h3>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low">
            <button
              type="button"
              onClick={() =>
                setPreferences((previous) => ({
                  ...previous,
                  notificationsEnabled: !previous.notificationsEnabled,
                }))
              }
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low"
            >
              <span className="font-medium text-sm">{t('settings.notifications')}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-on-surface-variant">{preferences.notificationsEnabled ? t('settings.enabled') : t('settings.disabled')}</span>
                <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPickerType('language')}
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low"
            >
              <span className="font-medium text-sm">{t('settings.language')}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-on-surface-variant">{languageLabel}</span>
                <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setPickerType('theme')}
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left"
            >
              <span className="font-medium text-sm">{t('settings.displayMode')}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-on-surface-variant">{themeLabel}</span>
                <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetPreferences}
            className="w-full mt-3 rounded-xl border border-surface-container-low bg-surface-container-lowest px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors"
          >
            {t('settings.resetPreferences')}
          </button>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">{t('settings.about')}</h3>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low">
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low"
            >
              <span className="font-medium text-sm">{t('settings.privacyPolicy')}</span>
              <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
            <div className="w-full flex items-center justify-between p-4 text-left">
              <span className="font-medium text-sm">{t('settings.aboutApp')}</span>
              <span className="text-xs text-on-surface-variant">v{appVersion}</span>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => setIsLogoutConfirmOpen(true)}
          className="w-full rounded-xl bg-primary text-on-primary py-3 font-semibold shadow-[0_8px_20px_rgba(0,88,187,0.25)] active:scale-[0.99] transition-transform"
        >
          {t('auth.logout')}
        </button>

      </div>

      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center p-4">
          <section className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-3">
            <h2 className="text-lg font-bold font-headline">隐私政策摘要</h2>
            <p className="text-sm text-on-surface-variant leading-6">
              我们仅收集完成行程规划所必要的信息，包括账号资料、操作日志与设备信息；不会在未经授权时共享个人敏感数据。
              如需删除账号或导出数据，请联系应用运营方处理。
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary text-sm font-semibold"
              >
                我已了解
              </button>
            </div>
          </section>
        </div>
      )}

      {pickerType && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center p-4">
          <section className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-surface-container p-3">
            <h2 className="text-base font-bold font-headline px-2 py-3">
              {pickerType === 'language' ? t('settings.selectLanguage') : t('settings.selectTheme')}
            </h2>

            {pickerType === 'language' ? (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPreferences((previous) => ({ ...previous, language: 'zh-CN' }));
                    setPickerType(null);
                  }}
                  className="w-full px-3 py-3 rounded-xl text-left hover:bg-surface-container-low transition-colors"
                >
                  {t('settings.chinese')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreferences((previous) => ({ ...previous, language: 'en-US' }));
                    setPickerType(null);
                  }}
                  className="w-full px-3 py-3 rounded-xl text-left hover:bg-surface-container-low transition-colors"
                >
                  {t('settings.english')}
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setPreferences((previous) => ({ ...previous, themeMode: 'system' }));
                    setPickerType(null);
                  }}
                  className="w-full px-3 py-3 rounded-xl text-left hover:bg-surface-container-low transition-colors"
                >
                  {t('settings.followSystem')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreferences((previous) => ({ ...previous, themeMode: 'light' }));
                    setPickerType(null);
                  }}
                  className="w-full px-3 py-3 rounded-xl text-left hover:bg-surface-container-low transition-colors"
                >
                  {t('settings.light')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreferences((previous) => ({ ...previous, themeMode: 'dark' }));
                    setPickerType(null);
                  }}
                  className="w-full px-3 py-3 rounded-xl text-left hover:bg-surface-container-low transition-colors"
                >
                  {t('settings.dark')}
                </button>
              </div>
            )}

            <div className="pt-3">
              <button
                type="button"
                onClick={() => setPickerType(null)}
                className="w-full rounded-xl bg-surface-container px-4 py-2.5 text-sm font-medium"
              >
                取消
              </button>
            </div>
          </section>
        </div>
      )}

      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-end sm:items-center justify-center p-4">
          <section className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-surface-container p-5 space-y-4">
            <h2 className="text-lg font-bold font-headline">{t('auth.logoutConfirm')}</h2>
            <p className="text-sm text-on-surface-variant">{t('auth.logoutDesc')}</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="rounded-lg bg-surface-container px-4 py-2.5 text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg bg-primary text-on-primary px-4 py-2.5 text-sm font-semibold"
              >
                {t('settings.confirmLogout')}
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
