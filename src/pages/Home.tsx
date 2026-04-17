import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <main className="text-on-surface bg-surface min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-40 bg-[#f7f5ff]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-surface-container">
            <img 
              className="w-full h-full object-cover" 
              alt="Profile" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNrwIUsVv00-3TzaxasKMLadmcPhK1MtWRH1WeKvCKQLd66E3LELr5sOiJpDCWtI1U_XVTk7NY690JjkelfF3WwHpyOYpaGSHf7cb5tjL0r-M8Lv1ocNJHtcKmBaUN-4r2oeHVmo0BmdDUZdDdYGqsbcVsHyU1CBHAj4rgxNsSpBUYq6f_gaa0m1WTHeDcAf3YZrYoQmvE34x_bXpZbb6pedKao0HO7WY5mOHNA5-hSgDaHrKVE0vO6gOJ6qGtOVaQ1v9SlJzm7ko" 
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[#232c51] font-black text-xl font-headline tracking-wider">发现灵感</span>
        </div>
        <div className="flex items-center gap-4 relative">
          <button 
            className="text-[#515981] hover:bg-black/5 p-2 rounded-full transition-colors active:scale-95 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <span className="material-symbols-outlined absolute top-2 right-2 text-error text-[10px] bg-error rounded-full ring-2 ring-[#f7f5ff]"></span>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-64 bg-surface rounded-2xl shadow-xl border border-surface-container-low overflow-hidden z-50">
              <div className="p-4 border-b border-surface-container-low flex justify-between items-center bg-surface-container-lowest">
                <span className="font-bold text-sm">系统消息</span>
                <button className="text-xs text-primary font-medium">全部已读</button>
              </div>
              <div className="max-h-64 overflow-y-auto no-scrollbar">
                 <div className="p-3 border-b border-surface-container-lowest hover:bg-surface-container-lowest transition-colors cursor-pointer">
                    <p className="text-sm font-bold text-on-surface mb-1">您的东京深度游行程建议已备好！</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">智能管家根据您的喜好为您量身定制了新的路线，点击查看详细安排。</p>
                 </div>
                 <div className="p-3 border-b border-surface-container-lowest hover:bg-surface-container-lowest transition-colors cursor-pointer">
                    <p className="text-sm font-bold text-on-surface mb-1">特价机票提醒</p>
                    <p className="text-xs text-on-surface-variant line-clamp-2">成都飞往首尔的周末往返机票有大幅降价，不容错过。</p>
                 </div>
                 <div className="p-3 hover:bg-surface-container-lowest transition-colors cursor-pointer">
                    <p className="text-sm border-on-surface-variant text-on-surface-variant mb-1 line-through">系统维护通知 (已过期)</p>
                 </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="pt-24 px-6 max-w-5xl mx-auto space-y-10">
        {/* Animated Search Bar */}
        <section className="relative group">
          <div className="flex items-center bg-surface-container-low rounded-full px-6 py-4 transition-all duration-300 group-focus-within:bg-surface-container-lowest group-focus-within:shadow-xl group-focus-within:ring-2 group-focus-within:ring-primary/20">
            <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
            <input 
              className="bg-transparent border-none outline-none focus:ring-0 w-full text-on-surface placeholder:text-on-surface-variant font-medium" 
              placeholder="搜索目的地或灵感" 
              type="text" 
            />
            <span className="material-symbols-outlined text-primary ml-2">tune</span>
          </div>
        </section>

        {/* Dynamic Category Bento */}
        <section className="grid grid-cols-4 gap-4">
          <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">flight</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">机票</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">hotel</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">酒店</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">attractions</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">景点</span>
          </div>
          <div className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-2xl bg-surface-variant/40 flex items-center justify-center text-on-surface-variant group-hover:bg-on-surface group-hover:text-surface transition-all duration-300">
              <span className="material-symbols-outlined text-2xl">map</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant">攻略</span>
          </div>
        </section>

        {/* Featured Carousel (Asymmetric) */}
        <section className="space-y-4 overflow-hidden -mx-6 px-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-extrabold text-on-surface font-headline chinese-header">本周精选目的地</h2>
            <button className="text-primary font-semibold text-sm hover:underline">查看全部</button>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 pr-12 snap-x">
            {/* Large Card */}
            <div className="flex-shrink-0 w-80 h-[420px] relative rounded-[2rem] overflow-hidden group shadow-lg cursor-pointer snap-center active:scale-[0.98] transition-transform">
              <img 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Tokyo" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeBIWAFI6gxtpeVUhW8CSPEtN6A2fUOwiTwo5YG5F4FQp8vrSEoOpafhdFnW_L0O1Y0peTXMikV-qAlW82EX_q8B469m7qouNX0LF_9EV-C4jUlbOBoZxK71iQavZowm2nCSMFAHv42f4d4pJPt90AuR-rzrRY6V2Gtj4XUhwZ6mVX_jiNBr-DT9pgS78N8sBX-AzdKH72IGlHPK45kAfK6P314h-UuJJQXeZSPxoAd5HcavtIhw4_7OVUW9A7EB_0LjMSWE7b7Bw"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 w-full">
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">高热度</span>
                <h3 className="text-white text-3xl font-black mb-1">东京, 日本</h3>
                <p className="text-white/80 text-sm font-medium">霓虹街头的都市浪漫</p>
              </div>
            </div>
            
            {/* Medium Card */}
            <div className="flex-shrink-0 w-64 h-[420px] relative rounded-[2rem] overflow-hidden group shadow-lg cursor-pointer snap-center active:scale-[0.98] transition-transform mt-8">
              <img 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Banff" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAi-Icew-aqpLkjf1dHRKJt1iQDrKKp97dIBZuliw8Eml-QHbiTj5Y7q_Zud4K5jEI1WjaxeSow0U1xqFctDhXwjiCKeLycaWSbNfeN_PTwg_hzFs7io5246I-jsNZSkPs8AUPqnXrsYXlQJrcMRU0ceVoDSPXFdVtlY6AE0xP4GGwHcFWIBaFOHPX4HH4o2hsWwNj91yTcHgJOwtGtuyM3l0ypiB0fCEg2ZyHd4P286l7Gpr5voGbJH_-I8KR4NBHAZt_iT-tYJZ0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">自然</span>
                <h3 className="text-white text-2xl font-black mb-1">班夫, 加拿大</h3>
                <p className="text-white/80 text-sm font-medium">沉浸于落基山脉的壮丽</p>
              </div>
            </div>

            {/* Medium Card 2 */}
            <div className="flex-shrink-0 w-64 h-[420px] relative rounded-[2rem] overflow-hidden group shadow-lg cursor-pointer snap-center active:scale-[0.98] transition-transform">
              <img 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                alt="Venice" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7Jp4bjBe3t7pMAgH8gH9VVKyKxS_c3w5sp6bpTOcJsmAyyunPLWxPSruo3HSMEGQvQC_NTHi6w7EB32XFb_lQNp3GrS8RsFJn5K-rgI5xyxxKRti2YiYvUqBkRt0cG_MJZZk2O1tbO3xAhJsegslgCDAbYFG_c1ZPSVVuN28aoLiPvFpUB1nxhVpcknG5Gy9BCIk8fl8NbzQohbDPjSE9ifciMxzz-7VFQ3A0381Ct_56mGKK5TylKA84fVfkTGCiOG7SgMznia8"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 w-full">
                <span className="bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-xs font-bold mb-3 inline-block">历史</span>
                <h3 className="text-white text-2xl font-black mb-1">威尼斯, 意大利</h3>
                <p className="text-white/80 text-sm font-medium">运河上的慢生活</p>
              </div>
            </div>
          </div>
        </section>

        {/* Personalized Recommendations */}
        <section className="space-y-6">
          <h2 className="text-2xl font-extrabold text-on-surface font-headline chinese-header">热门推荐</h2>
          <div className="space-y-6">
            
            {/* Item 1 */}
            <div className="flex gap-4 p-4 bg-surface-container-low rounded-[1.5rem] hover:bg-surface-container-lowest transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md">
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt="Bali Villa" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYvaUuDZgvKl00Hk3HHaK5s1qYKNHzol02D2bxDTQfUiRNU3MS9zAYD06cuImqq-iCfbaj_-5386rB9sn373xfSx8_-RPrkzOiuxe8JFb0RRbhJQrkIV3X38FmII0Um0CIWYkOqFqN3DztwzgLSE0RzPw_xqAgcJ14y6BPMTQ_OWnOXCb-dv3kSCHXWBFIJLOzzvTsFRDrm47EgJ-LJgwi9X-QE_wtJ9u1dKPWPrOZlIUw7MPOL5rgU4pkhCoa_wEcd9IJ-YZWIQo"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="bg-secondary-fixed text-on-secondary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold">度假</span>
                    <span className="bg-primary-container text-on-primary-container text-[10px] px-2 py-0.5 rounded-full font-bold">高性价比</span>
                  </div>
                  <h4 className="font-bold text-lg text-on-surface">巴厘岛奢华私人别墅：五天四晚避世指南</h4>
                  <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">发现乌布最隐秘的丛林秘境，享受地道水疗。</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-primary font-black text-lg">¥4,299 <span className="text-xs font-medium text-on-surface-variant">起</span></span>
                  <div className="flex items-center text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-sm mr-1" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    4.9 (1.2k 评价)
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex gap-4 p-4 bg-surface-container-low rounded-[1.5rem] hover:bg-surface-container-lowest transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md">
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <img 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt="Taj Mahal" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwYF8JRE-FeVfjByNANhvJdFyIW4759ybDV_tAE_nvMguKgCGv7-uw-WJMDNcam_cfCJbhcu9IjWXXMCcZ6caBwLeTSWD1XH4CiTJYcN6AkOUNrsnBXqu_xmIjzFiPvQplk-dFVQtacyj-uoeb3l7d8DFBaE-feCCT0GiDzm-UWSMFvboOU9XodyPXH8ejJLpq-TLDvzlurIqBRKgZmCoKpuFuXUspw6yYxzBltHzINv65-f8IcA5VcmeYka30ZhtSFg2Fup2ce4s"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <div className="flex gap-2 mb-2">
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded-full font-bold">文化之旅</span>
                  </div>
                  <h4 className="font-bold text-lg text-on-surface">泰姬陵：世界遗产深度摄影路线</h4>
                  <p className="text-sm text-on-surface-variant line-clamp-1 mt-1">从日出到黄昏，记录千年古堡的柔光变幻。</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-primary font-black text-lg">¥1,850 <span className="text-xs font-medium text-on-surface-variant">起</span></span>
                  <div className="flex items-center text-xs text-on-surface-variant font-medium">
                    <span className="material-symbols-outlined text-sm mr-1" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                    4.8 (856 评价)
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* FAB for AI Chat */}
      <Link to="/chat" className="fixed right-6 bottom-28 w-16 h-16 bg-primary rounded-full shadow-[0_12px_32px_rgba(35,44,81,0.2)] flex items-center justify-center text-white active:scale-90 transition-transform z-30">
        <span className="material-symbols-outlined text-3xl" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
      </Link>
    </main>
  );
}
