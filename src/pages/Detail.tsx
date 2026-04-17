import { useNavigate } from 'react-router-dom';

export default function Detail() {
  const navigate = useNavigate();

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen pb-24 relative selection:bg-primary/20">
      {/* Immersive Header Image with Gradient Fade */}
      <div className="relative w-full h-[50vh] min-h-[350px]">
        <img 
          className="w-full h-full object-cover" 
          alt="Destination Detail" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeBIWAFI6gxtpeVUhW8CSPEtN6A2fUOwiTwo5YG5F4FQp8vrSEoOpafhdFnW_L0O1Y0peTXMikV-qAlW82EX_q8B469m7qouNX0LF_9EV-C4jUlbOBoZxK71iQavZowm2nCSMFAHv42f4d4pJPt90AuR-rzrRY6V2Gtj4XUhwZ6mVX_jiNBr-DT9pgS78N8sBX-AzdKH72IGlHPK45kAfK6P314h-UuJJQXeZSPxoAd5HcavtIhw4_7OVUW9A7EB_0LjMSWE7b7Bw"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-surface"></div>
        
        {/* Floating Top Bar */}
        <header className="absolute top-0 w-full px-6 py-12 flex justify-between items-center z-20">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-xl" style={{fontVariationSettings: "'FILL' 0"}}>favorite</span>
            </button>
          </div>
        </header>
      </div>

      {/* Content Body */}
      <div className="relative -mt-10 px-6 z-10 w-full max-w-2xl mx-auto space-y-8">
        
        {/* Title Section */}
        <section>
          <div className="flex gap-2 mb-3">
            <span className="bg-secondary-container text-on-secondary-container text-xs px-2.5 py-1 rounded-sm font-bold tracking-wide">都市漫游</span>
            <span className="bg-surface-container-high text-on-surface-variant text-xs px-2.5 py-1 rounded-sm font-bold tracking-wide">精选推荐</span>
          </div>
          <h1 className="text-4xl font-black font-headline text-on-surface leading-tight mb-2">东京都市深度探险</h1>
          <p className="text-lg font-medium text-on-surface-variant mb-4">感受传统与未来交织的霓虹魅力</p>

          <div className="flex items-center gap-4 text-sm font-semibold">
            <div className="flex items-center text-tertiary">
              <span className="material-symbols-outlined text-[18px] mr-1" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
              <span className="text-base font-bold text-on-surface mr-1">4.9</span>
              <span className="text-on-surface-variant font-medium underline decoration-surface-container-high underline-offset-2 cursor-pointer">(2.4k 条评价)</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
            <div className="flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] mr-1">location_on</span>
              日本, 东京
            </div>
          </div>
        </section>

        <hr className="border-surface-container-low" />

        {/* Overview Row */}
        <section className="flex justify-between items-center bg-surface-container-lowest p-5 rounded-2xl shadow-[0_4px_24px_rgba(35,44,81,0.04)]">
          <div className="text-center">
            <span className="material-symbols-outlined text-outline mb-1 text-2xl">schedule</span>
            <p className="text-xs text-on-surface-variant font-medium">时长</p>
            <p className="text-sm font-bold text-on-surface mt-0.5">5天4晚</p>
          </div>
          <div className="w-px h-10 bg-surface-container-low"></div>
          <div className="text-center">
            <span className="material-symbols-outlined text-outline mb-1 text-2xl">group</span>
            <p className="text-xs text-on-surface-variant font-medium">成团人数</p>
            <p className="text-sm font-bold text-on-surface mt-0.5">2-6 人</p>
          </div>
          <div className="w-px h-10 bg-surface-container-low"></div>
          <div className="text-center">
            <span className="material-symbols-outlined text-outline mb-1 text-2xl">directions_walk</span>
            <p className="text-xs text-on-surface-variant font-medium">体力消耗</p>
            <p className="text-sm font-bold text-on-surface mt-0.5">中等</p>
          </div>
        </section>

        {/* Description */}
        <section>
          <h2 className="text-xl font-bold font-headline mb-4">关于此行程</h2>
          <p className="text-on-surface-variant leading-relaxed mb-4 text-[15px]">
            远离千篇一律的打卡景点，我们带您深入东京的隐秘角落。在下北泽的古着店寻找独特单品，在神乐坂的石板路上品味江户风情，夜晚则融入新宿的居酒屋文化。这是一次真正融入当地生活的深度体验之旅。
          </p>
          <button className="text-primary font-bold text-sm flex items-center hover:underline group">
            查看完整介绍 
            <span className="material-symbols-outlined text-[18px] ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
        </section>

        {/* Highlights */}
        <section>
          <h2 className="text-xl font-bold font-headline mb-4">行程亮点</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
               <div className="w-12 h-12 rounded-xl bg-primary-container/30 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>restaurant</span>
               </div>
               <div>
                  <h3 className="font-bold text-on-surface">米其林一星怀石料理体验</h3>
                  <p className="text-sm text-on-surface-variant mt-1">在百年老店中品尝按季节定制的正宗高级日料。</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="w-12 h-12 rounded-xl bg-tertiary-container/20 flex items-center justify-center text-tertiary shrink-0">
                  <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>museum</span>
               </div>
               <div>
                  <h3 className="font-bold text-on-surface">teamLab 沉浸式艺术展免排队</h3>
                  <p className="text-sm text-on-surface-variant mt-1">独家VIP通道，尽情享受光影与色彩交织的奇幻世界。</p>
               </div>
            </div>
          </div>
        </section>

        {/* map placeholder */}
        <section className="pb-10">
          <div className="w-full h-48 bg-surface-container rounded-2xl overflow-hidden relative">
             <img 
               className="w-full h-full object-cover opacity-60"
               src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=3274&auto=format&fit=crop" 
               alt="Map"
             />
             <div className="absolute inset-0 flex items-center justify-center">
                 <button className="bg-white/90 backdrop-blur text-on-surface px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2 hover:bg-white active:scale-95 transition-all">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    查看地图路线
                 </button>
             </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom Booking Bar */}
      <div className="fixed bottom-0 w-full bg-surface/90 backdrop-blur-xl border-t border-surface-container p-4 px-6 z-40 flex justify-between items-center pb-safe">
        <div>
          <p className="text-xs text-on-surface-variant font-medium mb-0.5">总价</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-black text-on-surface font-headline leading-none">¥6,899</span>
            <span className="text-xs text-on-surface-variant font-medium mb-1">/ 人起</span>
          </div>
        </div>
        <button className="bg-primary text-white font-bold text-base px-8 py-3.5 rounded-full shadow-[0_8px_24px_rgba(0,88,187,0.3)] hover:bg-primary-dim hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all flex items-center gap-2">
          立即预订
        </button>
      </div>
    </main>
  );
}
