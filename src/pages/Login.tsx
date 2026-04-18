import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/user';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialUsername =
    typeof location.state === 'object' &&
    location.state &&
    'username' in location.state &&
    typeof location.state.username === 'string'
      ? location.state.username
      : '';

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      setError('请输入用户名');
      return;
    }

    if (!password) {
      setError('请输入密码');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      const result = await login({ username: normalizedUsername, password });
      localStorage.setItem('token', result.token);
      localStorage.setItem('userInfo', JSON.stringify(result.user));
      navigate('/', { replace: true });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '登录失败，请稍后重试';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="font-body text-on-surface antialiased min-h-[100dvh] bg-surface flex flex-col relative overflow-hidden">
      {/* Decorative Background Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-container/40 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-10%] w-80 h-80 bg-secondary-container/30 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Header */}
      <header className="w-full flex justify-between items-center px-6 py-6 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant cursor-pointer -ml-2"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>
        <button
          onClick={() => navigate('/')}
          className="text-sm font-bold text-primary active:scale-95 transition-transform"
        >
          随便逛逛
        </button>
      </header>

      {/* Main Content */}
       <div className="flex-1 px-8 pt-8 pb-8 flex flex-col z-10 overflow-y-auto no-scrollbar">
        <div className="mb-10">
          <h1 className="text-4xl font-black font-headline tracking-tight text-on-surface mb-3">欢迎回来</h1>
          <p className="text-on-surface-variant font-medium text-[15px]">登录以开始规划您的下一次非凡旅程</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="group">
              <div className="flex items-center bg-surface-container-lowest border border-surface-container-high rounded-[1.25rem] px-5 py-3.5 transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-surface shadow-[0_4px_16px_rgba(0,0,0,0.02)]">
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">mail</span>
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
                <span className="material-symbols-outlined text-outline mr-3 group-focus-within:text-primary transition-colors">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="密码" 
                  autoComplete="current-password"
                  className="bg-transparent border-none outline-none w-full text-[15px] font-medium text-on-surface placeholder:text-on-surface-variant/70"
                />
                <button type="button" className="text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">visibility_off</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1 mb-6">
            <button type="button" className="text-sm font-bold text-primary hover:underline">
              忘记密码？
            </button>
          </div>

          {error && (
            <p className="text-sm text-error font-medium px-1">{error}</p>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-primary text-white font-bold text-[16px] py-4 rounded-full shadow-[0_8px_24px_rgba(0,88,187,0.3)] hover:bg-primary-dim hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all"
          >
            {isSubmitting ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Flexible spacer to push the footer down without breaking scroll */}
        <div className="flex-1 min-h-[4rem]"></div>

        <div className="pb-safe">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 flex items-center px-4">
              <div className="w-full border-t border-surface-container-high"></div>
            </div>
            <span className="relative bg-surface px-4 text-xs font-semibold text-on-surface-variant">其他方式登录</span>
          </div>

          <div className="flex justify-center gap-5 mb-8">
            <button className="w-14 h-14 rounded-full bg-[#f4f8f5] border border-[#e1f0e5] flex items-center justify-center hover:bg-[#e8f4eb] active:scale-95 transition-all shadow-sm cursor-pointer text-[#07C160]">
              <svg viewBox="0 0 1024 1024" fill="currentColor" className="w-7 h-7">
                <path d="M682.666667 362.666667A274.56 274.56 0 0 0 426.666667 64C238.293333 64 64 213.333333 64 362.666667c0 85.333333 42.666667 170.666667 106.666667 213.333333-10.666667 21.333333-21.333333 42.666667-21.333333 64 0 10.666667 10.666667 21.333333 21.333333 21.333333 21.333333 0 64-10.666667 106.666667-32 32 10.666667 74.666667 21.333333 128 21.333333 21.333333 0 42.666667-10.666667 64-10.666667-10.666667-21.333333-10.666667-42.666667-10.666667-64C458.666667 471.466667 554.666667 384 682.666667 362.666667zM256 256c21.333333 0 42.666667 10.666667 42.666667 32s-21.333333 32-42.666667 32-42.666667-10.666667-42.666667-32 21.333333-32 42.666667-32 42.666667 10.666667 42.666667 32z m234.666667 64c0 21.333333-21.333333 32-42.666667 32s-42.666667-10.666667-42.666667-32 21.333333-32 42.666667-32 42.666667 10.666667 42.666667 32z m469.333333 192c0-149.333333-149.333333-277.333333-320-277.333333s-320 128-320 277.333333 149.333333 277.333333 320 277.333333c42.666667 0 85.333333-10.666667 128-21.333333 42.666667 21.333333 74.666667 32 96 32 10.666667 0 21.333333-10.666667 21.333333-21.333333 0-21.333333-10.666667-42.666667-21.333333-64 53.333333-42.666667 96-106.666667 96-202.666667z m-405.333333-42.666667c-21.333333 0-32-10.666667-32-32s10.666667-32 32-32 32 10.666667 32 32-10.666667 32-32 32z m192 0c-21.333333 0-32-10.666667-32-32s10.666667-32 32-32 32 10.666667 32 32-10.666667 32-32 32z"/>
              </svg>
            </button>
            <button className="w-14 h-14 rounded-full bg-[#000000] flex items-center justify-center hover:bg-[#333333] active:scale-95 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] cursor-pointer text-white">
              <svg viewBox="0 0 384 512" fill="currentColor" className="w-[20px] h-[20px] mb-[2px]">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
              </svg>
            </button>
            <button className="w-14 h-14 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center hover:bg-surface-container-low active:scale-95 transition-all shadow-sm cursor-pointer text-outline-variant">
              <span className="material-symbols-outlined text-[24px]">mail</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-on-surface-variant font-medium text-[15px]">还没有账号？ </span>
            <Link to="/register" className="text-primary font-bold hover:underline transition-all">
              立即注册
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
