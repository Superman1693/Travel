import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUser, type User } from '../services/user';

interface SecurityCompletion {
  phone: string;
}

const SECURITY_COMPLETION_STORAGE_KEY = 'travel.settings.securityCompletion';

const readSecurityCompletion = (): SecurityCompletion => {
  const raw = localStorage.getItem(SECURITY_COMPLETION_STORAGE_KEY);
  if (!raw) {
    return { phone: '' };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SecurityCompletion>;
    return {
      phone: typeof parsed.phone === 'string' ? parsed.phone : '',
    };
  } catch {
    return { phone: '' };
  }
};

export default function AccountSecurity() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [phone, setPhone] = useState(() => readSecurityCompletion().phone);
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState('');

  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const completionRate = useMemo(() => {
    let completed = 0;
    if ((user?.email || '').trim()) {
      completed += 1;
    }
    if (phone.trim()) {
      completed += 1;
    }
    return Math.round((completed / 2) * 100);
  }, [phone, user?.email]);

  const maskedPhone = useMemo(() => {
    if (!/^1\d{10}$/.test(phone)) {
      return '';
    }
    return `${phone.slice(0, 3)}****${phone.slice(7)}`;
  }, [phone]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const cachedUser = localStorage.getItem('userInfo');
    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser) as User;
        setUser(parsedUser);
        setEmail(parsedUser.email || '');
      } catch {
        localStorage.removeItem('userInfo');
      }
    }

    const fetchUser = async () => {
      try {
        const latestUser = await getCurrentUser();
        setUser(latestUser);
        setEmail(latestUser.email || '');
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

  const handleSavePhone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPhone = phone.trim();
    if (!/^1\d{10}$/.test(trimmedPhone)) {
      setFeedback('请输入有效的 11 位手机号');
      return;
    }

    setIsSavingPhone(true);
    // TODO: 后端 User/UpdateUserRequest 接口暂不支持 phone 字段，待后端扩展后改为调用 updateUser API
    localStorage.setItem(
      SECURITY_COMPLETION_STORAGE_KEY,
      JSON.stringify({
        phone: trimmedPhone,
      })
    );
    setIsSavingPhone(false);
    setFeedback('手机号已保存至本地，可用于下单联系人自动填充');
  };

  const handleClearPhone = () => {
    setPhone('');
    localStorage.setItem(
      SECURITY_COMPLETION_STORAGE_KEY,
      JSON.stringify({
        phone: '',
      })
    );
    setFeedback('手机号信息已清除');
  };

  const handleSaveEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFeedback('邮箱不能为空');
      return;
    }

    try {
      setIsSavingEmail(true);
      setFeedback('');
      const updatedUser = await updateUser({ email: trimmedEmail });
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      setFeedback('邮箱更新成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '邮箱更新失败';
      setFeedback(message);
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleSavePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      setFeedback('请完整填写密码信息');
      return;
    }

    if (newPassword.length < 6) {
      setFeedback('新密码至少 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback('两次输入的新密码不一致');
      return;
    }

    try {
      setIsSavingPassword(true);
      setFeedback('');
      await updateUser({ oldPassword, newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFeedback('密码更新成功');
    } catch (error) {
      const message = error instanceof Error ? error.message : '密码更新失败';
      setFeedback(message);
    } finally {
      setIsSavingPassword(false);
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
        <h1 className="text-xl font-bold font-headline text-on-surface">账号与安全</h1>
      </header>

      <div className="px-6 py-4 space-y-6">
        <section className="rounded-2xl bg-surface-container-lowest border border-surface-container-low p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">资料补全进度</h3>
            <span className="text-xs text-on-surface-variant">{completionRate}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2">
            建议先补全手机号和邮箱，后续可直接支持手机号注册与安全校验。
          </p>
        </section>

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

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">手机号补全</h3>
          <form onSubmit={handleSavePhone} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low p-4 space-y-3">
            <label htmlFor="phone" className="text-xs text-on-surface-variant">手机号（用于后续手机号注册）</label>
            <div className="flex gap-2 items-center">
              <input
                ref={phoneInputRef}
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="请输入 11 位手机号"
                className="w-full rounded-lg border border-surface-container bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={isSavingPhone}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary disabled:opacity-60"
              >
                {isSavingPhone ? '保存中' : '保存'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-on-surface-variant">
                当前手机号：{maskedPhone || '未补全'}
              </p>
              {phone && (
                <button
                  type="button"
                  onClick={handleClearPhone}
                  className="text-xs text-on-surface-variant hover:text-primary transition-colors"
                >
                  清除
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">邮箱绑定</h3>
          <form onSubmit={handleSaveEmail} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low p-4 space-y-3">
            <label htmlFor="email" className="text-xs text-on-surface-variant">绑定邮箱</label>
            <div className="flex gap-2 items-center">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="请输入邮箱"
                className="w-full rounded-lg border border-surface-container bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                disabled={isSavingEmail}
                className="px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary disabled:opacity-60"
              >
                {isSavingEmail ? '保存中' : '保存'}
              </button>
            </div>
          </form>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">修改密码</h3>
          <form onSubmit={handleSavePassword} className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low p-4 space-y-2">
            <input
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              placeholder="当前密码"
              className="w-full rounded-lg border border-surface-container bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="新密码（至少 6 位）"
              className="w-full rounded-lg border border-surface-container bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="确认新密码"
              className="w-full rounded-lg border border-surface-container bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="submit"
              disabled={isSavingPassword}
              className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-primary text-on-primary disabled:opacity-60"
            >
              {isSavingPassword ? '更新中' : '更新密码'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
