import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword, sendResetCode } from '../services/user';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // 验证码 60 秒倒计时，倒计时期间禁用发送按钮
  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCountdown((previous) => previous - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();

    if (!normalizedUsername) {
      setError('请先输入用户名');
      return;
    }

    if (!normalizedEmail) {
      setError('请先输入邮箱');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsSendingCode(true);
      await sendResetCode({ username: normalizedUsername, email: normalizedEmail });
      setSuccess('验证码已发送，请查收邮箱');
      setCountdown(60);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : '验证码发送失败，请稍后重试';
      setError(message);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim();
    const normalizedCode = code.trim();

    if (!normalizedUsername) {
      setError('请输入用户名');
      return;
    }

    if (!normalizedEmail) {
      setError('请输入邮箱');
      return;
    }

    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('请输入 6 位数字验证码');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码至少 6 位');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsSubmitting(true);
      await resetPassword({
        username: normalizedUsername,
        email: normalizedEmail,
        code: normalizedCode,
        newPassword,
      });
      setSuccess('密码重置成功，请使用新密码登录');
      setTimeout(() => navigate('/login', { replace: true, state: { username: normalizedUsername } }), 1200);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '重置密码失败，请稍后重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="font-body text-on-surface antialiased min-h-[100dvh] bg-surface flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-container/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-secondary-container/25 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <header className="w-full flex justify-between items-center px-6 py-6 z-10">
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant cursor-pointer -ml-2"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <div className="w-10 h-10" aria-hidden="true"></div>
      </header>

      <div className="flex-1 px-8 pt-4 pb-8 flex flex-col z-10 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface mb-3">找回密码</h1>
          <p className="text-on-surface-variant font-medium text-[15px]">输入用户名与邮箱，通过邮箱验证码重置密码</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">person</span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="用户名"
                  autoComplete="username"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="邮箱"
                  autoComplete="email"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">sms</span>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                  placeholder="6 位邮箱验证码"
                  autoComplete="one-time-code"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0}
                  className="ml-3 shrink-0 whitespace-nowrap text-sm font-bold text-primary active:scale-95 transition-transform disabled:text-on-surface-variant/50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {countdown > 0 ? `${countdown}s 后重发` : isSendingCode ? '发送中...' : '发送验证码'}
                </button>
              </div>
            </div>

            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">lock</span>
                <input
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="新密码"
                  autoComplete="new-password"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((previous) => !previous)}
                  className="text-outline hover:text-on-surface transition-colors"
                  aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
                >
                  <span className="material-symbols-outlined text-[20px]">{isPasswordVisible ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">lock</span>
                <input
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="再次输入新密码"
                  autoComplete="new-password"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible((previous) => !previous)}
                  className="text-outline hover:text-on-surface transition-colors"
                  aria-label={isConfirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}
                >
                  <span className="material-symbols-outlined text-[20px]">{isConfirmPasswordVisible ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-error font-medium px-1">{error}</p>}
          {success && <p className="text-sm text-primary font-medium px-1">{success}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold text-[16px] py-4 rounded-full shadow-[0_8px_24px_rgba(0,88,187,0.3)] hover:bg-primary-dim hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all"
          >
            {isSubmitting ? '重置中...' : '重置密码'}
          </button>
        </form>
      </div>
    </main>
  );
}