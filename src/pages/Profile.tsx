import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="font-body text-on-surface antialiased pb-28 min-h-screen px-6 pt-4 flex flex-col gap-8 bg-surface">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-30 bg-[#f7f5ff] font-['Plus_Jakarta_Sans'] font-bold tracking-tight">
        <div className="flex justify-between items-center py-4 w-full">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="text-[#0058bb] hover:bg-black/5 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center -ml-2 cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-bold text-[#232c51]">Profile</h1>
          <Link to="/settings" className="text-[#0058bb] hover:bg-black/5 transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center -mr-2">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </header>

      {/* Profile Header Area */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_rgba(35,44,81,0.06)] flex items-center gap-6 relative overflow-hidden">
        {/* Decorative Gradient Blob */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary-container to-surface opacity-50 blur-2xl"></div>
        <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 border-surface-container-low shadow-sm z-10">
          <img 
            className="w-full h-full object-cover" 
            alt="Profile portrait" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNrwIUsVv00-3TzaxasKMLadmcPhK1MtWRH1WeKvCKQLd66E3LELr5sOiJpDCWtI1U_XVTk7NY690JjkelfF3WwHpyOYpaGSHf7cb5tjL0r-M8Lv1ocNJHtcKmBaUN-4r2oeHVmo0BmdDUZdDdYGqsbcVsHyU1CBHAj4rgxNsSpBUYq6f_gaa0m1WTHeDcAf3YZrYoQmvE34x_bXpZbb6pedKao0HO7WY5mOHNA5-hSgDaHrKVE0vO6gOJ6qGtOVaQ1v9SlJzm7ko" 
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col z-10">
          <h2 className="font-headline text-2xl text-on-surface mb-2">Alex Horizon</h2>
          <div>
            <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              高级旅客
            </span>
          </div>
        </div>
      </section>

      {/* My Orders */}
      <section>
        <h3 className="font-headline text-lg text-on-surface mb-4 px-2 font-bold tracking-wider">我的订单</h3>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_rgba(35,44,81,0.06)]">
          <div className="flex justify-between items-start">
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">待付款</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300 relative">
                <span className="absolute top-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-surface-container-lowest"></span>
                <span className="material-symbols-outlined text-primary text-2xl">flight_takeoff</span>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">待出行</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">task_alt</span>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">已完成</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95">
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">currency_exchange</span>
              </div>
              <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors">退款/售后</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Actions (Bento Grid) */}
      <section>
        <h3 className="font-headline text-lg text-on-surface mb-4 px-2 font-bold tracking-wider">常用工具</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-secondary text-2xl bg-secondary-container/30 p-2 rounded-full">favorite</span>
            <span className="font-medium text-on-surface text-sm">我的收藏</span>
          </button>
          <button className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-tertiary-container text-2xl bg-tertiary-container/10 p-2 rounded-full">rate_review</span>
            <span className="font-medium text-on-surface text-sm">我的点评</span>
          </button>
          <button className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-primary text-2xl bg-primary-container/20 p-2 rounded-full">group</span>
            <span className="font-medium text-on-surface text-sm">常用旅客</span>
          </button>
          <button className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-tertiary text-2xl bg-tertiary/10 p-2 rounded-full">confirmation_number</span>
            <span className="font-medium text-on-surface text-sm">优惠券</span>
          </button>
          <button className="col-span-2 bg-surface-container-lowest rounded-xl p-5 flex items-center justify-between shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-outline text-2xl bg-surface-container p-2 rounded-full">support_agent</span>
              <span className="font-medium text-on-surface text-sm">帮助中心</span>
            </div>
            <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
          </button>
        </div>
      </section>

      {/* System Actions */}
      <section className="mt-4 flex flex-col gap-4 pb-12">
        <button className="w-full bg-surface-container-low text-error rounded-xl p-5 font-headline font-bold text-center transition-colors hover:bg-error-dim hover:text-white cursor-pointer active:scale-95">
          退出登录
        </button>
      </section>

      {/* Sidebar Overlay and Panel */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 bg-surface-container-lowest z-[70] transform transition-transform duration-300 shadow-2xl flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Drawer Header */}
        <div className="p-6 pt-12 bg-surface-container border-b border-surface-container-high flex justify-between items-center">
          <div>
            <h2 className="font-headline font-black text-xl text-primary tracking-tight">Horizon</h2>
            <p className="text-xs text-on-surface-variant mt-1 font-medium">探索世界的更多可能</p>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-highest hover:bg-surface-variant transition-colors text-on-surface-variant cursor-pointer active:scale-95 mt-[-10px]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-primary-container hover:text-primary-dim rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">account_balance_wallet</span>
              我的钱包
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-primary-container hover:text-primary-dim rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">verified_user</span>
              实名认证
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-primary-container hover:text-primary-dim rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">card_membership</span>
              会员中心
            </button>
          </div>

          <div className="mx-6 my-4 h-px bg-surface-container-low"></div>

          <div className="space-y-1 px-3">
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-surface-container-low rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">person_add</span>
              邀请好友
            </button>
            <button className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-surface-container-low rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">support_agent</span>
              在线客服
            </button>
          </div>
        </div>
        
        {/* Drawer Footer */}
        <div className="p-6 text-center text-xs text-on-surface-variant border-t border-surface-container-low">
          <p>Horizon Travel App v1.0</p>
        </div>
      </div>
    </main>
  );
}
