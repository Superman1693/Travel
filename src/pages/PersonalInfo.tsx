import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, type User } from '../services/user';

interface PersonalInfoDraft {
  nickname: string;
  city: string;
  birthday: string;
  bio: string;
}

const PERSONAL_INFO_STORAGE_KEY = 'travel.settings.personalInfo';

const DEFAULT_DRAFT: PersonalInfoDraft = {
  nickname: '',
  city: '',
  birthday: '',
  bio: '',
};

const readDraft = (): PersonalInfoDraft => {
  const raw = localStorage.getItem(PERSONAL_INFO_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_DRAFT;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersonalInfoDraft>;
    return {
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : DEFAULT_DRAFT.nickname,
      city: typeof parsed.city === 'string' ? parsed.city : DEFAULT_DRAFT.city,
      birthday: typeof parsed.birthday === 'string' ? parsed.birthday : DEFAULT_DRAFT.birthday,
      bio: typeof parsed.bio === 'string' ? parsed.bio : DEFAULT_DRAFT.bio,
    };
  } catch {
    return DEFAULT_DRAFT;
  }
};

export default function PersonalInfo() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [draft, setDraft] = useState<PersonalInfoDraft>(() => readDraft());
  const [feedback, setFeedback] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayName = useMemo(() => user?.username || '游客', [user]);
  const displayEmail = useMemo(() => user?.email || '暂未绑定邮箱', [user]);
  const roleLabel = user?.role === 'admin' ? '管理员' : '普通用户';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const cachedUser = localStorage.getItem('userInfo');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser) as User);
      } catch {
        localStorage.removeItem('userInfo');
      }
    }

    const fetchUser = async () => {
      try {
        const latestUser = await getCurrentUser();
        setUser(latestUser);
        localStorage.setItem('userInfo', JSON.stringify(latestUser));
      } catch (error) {
        const message = error instanceof Error ? error.message : '获取用户信息失败';
        setFetchError(message);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // TODO: 后端 UpdateUserRequest 目前仅支持 email/oldPassword/newPassword 字段
  // 当后端扩展支持 nickname/city/birthday/bio 字段后，此处应改为调用 updateUser API
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setFeedback('');
      localStorage.setItem(PERSONAL_INFO_STORAGE_KEY, JSON.stringify(draft));
      setFeedback('个人资料已保存（本地）');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : '保存失败';
      setFeedback(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen pb-12 flex flex-col">
      <header className="flex items-center px-4 py-4 bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={() => navigate('/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant mr-2"
          aria-label="返回设置"
        >
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline text-on-surface">个人信息</h1>
      </header>

      <div className="px-6 py-4 space-y-6">
        {(isLoadingUser || fetchError || feedback) && (
          <section
            className={`rounded-xl px-4 py-3 text-sm ${
              fetchError
                ? 'bg-error/10 text-error'
                : feedback
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-surface-container-low text-on-surface-variant'
            }`}
          >
            {isLoadingUser ? '正在同步用户信息...' : fetchError || feedback}
          </section>
        )}

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 to-primary-fixed p-5 text-white shadow-[0_16px_36px_rgba(0,88,187,0.24)]">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white/85">旅行账号</p>
              <h2 className="text-2xl font-bold font-headline mt-1">{displayName}</h2>
              <p className="text-sm text-white/90 mt-1">{displayEmail}</p>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">{roleLabel}</span>
          </div>
        </section>

        <form onSubmit={handleSave} className="space-y-4">
          <section className="bg-surface-container-lowest rounded-2xl border border-surface-container-low p-4 space-y-3 shadow-sm">
            <h3 className="text-sm font-bold">资料展示</h3>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs text-on-surface-variant" htmlFor="nickname">昵称</label>
              <input
                id="nickname"
                value={draft.nickname}
                onChange={(event) => setDraft((prev) => ({ ...prev, nickname: event.target.value }))}
                placeholder="例如：海边散步的人"
                className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />

              <label className="text-xs text-on-surface-variant" htmlFor="city">所在城市</label>
              <input
                id="city"
                value={draft.city}
                onChange={(event) => setDraft((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="例如：赣州"
                className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />

              <label className="text-xs text-on-surface-variant" htmlFor="birthday">生日</label>
              <input
                id="birthday"
                type="date"
                value={draft.birthday}
                onChange={(event) => setDraft((prev) => ({ ...prev, birthday: event.target.value }))}
                className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />

              <label className="text-xs text-on-surface-variant" htmlFor="bio">个人简介</label>
              <textarea
                id="bio"
                rows={4}
                value={draft.bio}
                onChange={(event) => setDraft((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="介绍一下你的旅行偏好和目的地风格"
                className="w-full rounded-xl border border-surface-container bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-xl bg-primary text-on-primary py-3 font-semibold shadow-[0_10px_22px_rgba(0,88,187,0.22)] disabled:opacity-60"
          >
            {isSaving ? '保存中...' : '保存资料'}
          </button>

          <p className="text-xs text-on-surface-variant px-1">
            当前页面用于资料展示与编辑；账号绑定、密码、手机号补全请前往“账号与安全”。
          </p>
        </form>
      </div>
    </main>
  );
}
