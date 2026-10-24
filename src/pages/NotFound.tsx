import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface text-on-surface px-6 pb-24 pt-20 flex items-center justify-center">
      <section className="w-full max-w-md bg-surface-container-low rounded-3xl p-8 shadow-sm border border-surface-container">
        <div className="w-16 h-16 rounded-2xl bg-primary-container text-primary flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            travel_explore
          </span>
        </div>
        <p className="text-sm text-on-surface-variant mb-2">错误代码 404</p>
        <h1 className="text-3xl font-black mb-3">页面走丢了</h1>
        <p className="text-sm text-on-surface-variant leading-6 mb-8">
          你访问的页面不存在，可能链接已失效，或者地址输入有误。
        </p>
        <div className="flex gap-3">
          <Link
            to="/"
            className="flex-1 text-center bg-primary text-on-primary rounded-xl py-3 font-semibold active:scale-95 transition-transform"
          >
            返回首页
          </Link>
          <Link
            to="/destinations"
            className="flex-1 text-center bg-surface rounded-xl py-3 font-semibold border border-outline-variant active:scale-95 transition-transform"
          >
            去看目的地
          </Link>
        </div>
      </section>
    </main>
  );
}
