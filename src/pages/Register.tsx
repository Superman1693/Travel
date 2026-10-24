import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/user';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 32) {
      setError('用户名长度需在 3-32 位之间');
      return;
    }

    if (normalizedPhone && !/^1\d{10}$/.test(normalizedPhone)) {
      setError('请输入有效的 11 位手机号');
      return;
    }

    if (password.length < 6 || password.length > 32) {
      setError('密码长度需在 6-32 位之间');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!agreed) {
      setError('请先同意服务条款与隐私政策');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsSubmitting(true);
      await register({
        username: normalizedUsername,
        password,
        email: normalizedEmail || undefined,
        phone: normalizedPhone || undefined,
      });
      setSuccess('注册成功，正在跳转到登录页');
      navigate('/login', {
        replace: true,
        state: { username: normalizedUsername },
      });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '注册失败，请稍后重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="font-body text-on-surface antialiased min-h-[100dvh] bg-surface flex flex-col relative overflow-hidden">
      {/* Decorative Background Blob */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-tertiary-container/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-primary-container/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-6 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant cursor-pointer -ml-2"
        >
          <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
      </header>

      {/* Main Content */}
      <div className="flex-1 px-8 pt-4 pb-8 flex flex-col z-10 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface mb-3">加入我们</h1>
          <p className="text-on-surface-variant font-medium text-[15px]">创建您的专属 Horizon 账号，探索世界</p>
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
                  placeholder="昵称" 
                  autoComplete="username"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
              </div>
            </div>
<div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">call</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="手机号" 
                  autoComplete="tel"
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
                  placeholder="电子邮箱" 
                  autoComplete="email"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
              </div>
            </div>

            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="设置密码" 
                  autoComplete="new-password"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((previous) => !previous)}
                  className="text-outline hover:text-on-surface transition-colors"
                  aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isPasswordVisible ? 'visibility' : 'visibility_off'}
                  </span>
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
                  placeholder="再次输入密码" 
                  autoComplete="new-password"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
                <button
                  type="button"
                  onClick={() => setIsConfirmPasswordVisible((previous) => !previous)}
                  className="text-outline hover:text-on-surface transition-colors"
                  aria-label={isConfirmPasswordVisible ? '隐藏确认密码' : '显示确认密码'}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isConfirmPasswordVisible ? 'visibility' : 'visibility_off'}
                  </span>
                </button>
              </div>
            </div>
            
          </div>

          <div className="pt-2 pb-6 flex items-start gap-3">
             <input
              type="checkbox"
              id="terms"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
              className="mt-1 flex-shrink-0 w-4 h-4 rounded border-surface-container-high text-primary focus:ring-primary accent-primary"
            />
             <label htmlFor="terms" className="text-xs font-medium text-on-surface-variant leading-relaxed cursor-pointer">
              注册即表示我已阅读并同意<span className="text-primary font-bold hover:underline mx-1">服务条款</span>和<span className="text-primary font-bold hover:underline mx-1">隐私政策</span>。
             </label>
          </div>

          {error && (
            <p className="text-sm text-error font-medium px-1">{error}</p>
          )}

          {success && (
            <p className="text-sm text-primary font-medium px-1">{success}</p>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold text-[16px] py-4 rounded-full shadow-[0_8px_24px_rgba(0,88,187,0.3)] hover:bg-primary-dim hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all"
          >
            {isSubmitting ? '注册中...' : '注册账号'}
          </button>
        </form>
       <div className="flex-1 min-h-[4rem]"></div>
        <div className="pb-safe">
          <div className="text-center">
            <span className="text-on-surface-variant font-medium text-[15px]">已有账号？ </span>
            <Link to="/login" className="text-primary font-bold hover:underline transition-all">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
