import { Link } from 'react-router-dom';

export default function Itinerary() {
  return (
    <main className="font-body text-on-surface antialiased bg-surface min-h-screen pb-28">
      {/* Hero Header with Map Background */}
      <div className="relative w-full h-[35vh] min-h-[260px] bg-surface-container-high rounded-b-[2.5rem] overflow-hidden shadow-sm">
         <img 
           className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
           src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=3274&auto=format&fit=crop"
           alt="Map overview"
         />
         <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60"></div>
         
         <header className="absolute top-0 w-full px-6 py-10 flex justify-between items-start z-20 text-white">
           <div>
             <h1 className="text-3xl font-black font-headline tracking-wide drop-shadow-md mb-2">我的成都之行</h1>
             <div className="flex items-center gap-2 opacity-90 drop-shadow-md">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                <span className="text-sm font-medium">4月20日 - 4月24日</span>
                <span className="w-1 h-1 bg-white rounded-full mx-1"></span>
                <span className="text-sm font-medium">4 人</span>
             </div>
           </div>
           <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-sm cursor-pointer active:scale-95">
             <span className="material-symbols-outlined text-[20px]">share</span>
           </button>
         </header>

         {/* Floating Action / Route Preview */}
         <div className="absolute bottom-6 right-6 z-20">
           <button className="bg-white/90 backdrop-blur-md text-primary px-4 py-2.5 rounded-full font-bold text-xs shadow-lg flex items-center gap-2 active:scale-95 transition-transform cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">explore</span>
              <span>路线总览</span>
           </button>
         </div>
      </div>

      {/* Sticky Day Tabs */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md px-6 py-3 border-b border-surface-container-low shadow-[0_4px_16px_rgba(0,0,0,0.02)] mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          <button className="shrink-0 px-5 py-2.5 rounded-full bg-primary text-white font-bold shadow-md active:scale-95 transition-transform text-sm cursor-pointer">
            第 1 天<span className="font-normal opacity-80 text-xs ml-1">· 4/20</span>
          </button>
          <button className="shrink-0 px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high active:scale-95 transition-transform text-sm cursor-pointer">
            第 2 天<span className="font-normal text-on-surface-variant text-xs ml-1">· 4/21</span>
          </button>
          <button className="shrink-0 px-5 py-2.5 rounded-full bg-surface-container-low text-on-surface font-semibold hover:bg-surface-container-high active:scale-95 transition-transform text-sm cursor-pointer">
            第 3 天<span className="font-normal text-on-surface-variant text-xs ml-1">· 4/22</span>
          </button>
        </div>
      </div>

      <div className="px-6 space-y-8">
        
        {/* Place 1 */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-0 bottom-[-2rem] w-px bg-[#a2abd7]/40"></div>
          <div className="absolute left-[-4px] top-6 w-2 h-2 rounded-full bg-[#0058bb] ring-4 ring-[#e4e7ff]"></div>
          
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-black text-[#0058bb] tracking-tight">09:00 AM</span>
            <span className="text-xs font-semibold text-[#515981] bg-[#efefff] px-2 py-0.5 rounded-md">建议游玩 3 小时</span>
          </div>

          <Link to="/detail" className="block bg-[#ffffff] rounded-2xl p-4 shadow-[0_4px_16px_rgba(35,44,81,0.06)] active:scale-[0.98] transition-transform">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Panda" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB26A0Neyq5Yp2eP4I844z64Z0dGg2z7Lp-F9A5CqM7G6_bS4X1T_T7i4m_m0b8Vb4x9r818p7e3N60NlD_bW6ZfE9c90I3gP6Zp0PjL0C2c2h3I7M1h3S7m5uO7e6tI1bZ7u8Z4x1g9P5h5c7r7p3S9X2H5o8T8w8j9S6T7u2o4G7E8Z6p5q2v1k5e9x7v8P6d5m6X7w1G4V6e8B6g0s7Q8v3n4X7T7v9J9S9T7w9O6B8_F3r3F9O8z5R4x6U3C1v6B9D0F3c0C5L6r4U0C"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-lg text-[#232c51]">大熊猫繁育研究基地</h3>
                  <div className="flex items-center text-[#515981] text-xs mt-1">
                    <span className="material-symbols-outlined text-[14px] mr-1">location_on</span>
                    <span>距离酒店 12km</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-[#e4e7ff] text-[#004ca4] text-[10px] px-2 py-1 rounded-md font-bold">必打卡</span>
                  <span className="bg-[#d5dbff] text-[#515981] text-[10px] px-2 py-1 rounded-md font-bold">需提前购票</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Place 2 */}
        <div className="relative pl-8">
          <div className="absolute left-0 top-0 bottom-[-2rem] w-px bg-[#a2abd7]/40"></div>
          <div className="absolute left-[-4px] top-6 w-2 h-2 rounded-full bg-[#a2abd7] ring-4 ring-[#efefff]"></div>
          
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-black text-[#6c759e] tracking-tight">12:30 PM</span>
          </div>

          <div className="block bg-[#ffffff] rounded-2xl p-4 shadow-[0_4px_16px_rgba(35,44,81,0.06)] active:scale-[0.98] transition-transform">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl flex items-center justify-center shrink-0 bg-[#ff9817]/10">
                <span className="material-symbols-outlined text-[#884d00] text-3xl">restaurant</span>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="font-bold text-lg text-[#232c51]">特色川菜午餐</h3>
                <p className="text-[#515981] text-xs mt-2 leading-relaxed">推荐：马旺子（春熙路店），建议提前排队。</p>
              </div>
            </div>
          </div>
        </div>

        {/* Place 3 */}
        <div className="relative pl-8">
          <div className="absolute left-[-4px] top-6 w-2 h-2 rounded-full bg-[#a2abd7] ring-4 ring-[#efefff]"></div>
          
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-black text-[#6c759e] tracking-tight">14:00 PM</span>
            <span className="text-xs font-semibold text-[#515981] bg-[#efefff] px-2 py-0.5 rounded-md">建议游玩 2 小时</span>
          </div>

          <div className="block bg-[#ffffff] rounded-2xl p-4 shadow-[0_4px_16px_rgba(35,44,81,0.06)] active:scale-[0.98] transition-transform">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                <img 
                  className="w-full h-full object-cover" 
                  alt="Kuanzhai Alley" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtgJcE2y3g_2d0t2r9j8jK_j9v7s0R5g7v1G7p0F8T5d4X4r8x5P8E6U9j7a4u2b6v4M3D5c9F3T5z1S6K0s2O3Z3n7C2v4g3N2y9L3F6y4C4K_D4M5c9F6Z9Y3q7p5W8Z_D0u3q8K9R0f5B0n3Y2P3s7g8j2S9v0P9C5Q3M7N1U2q7r5I1R4u1c6r1G9D0y8_I0w7q3z4n1R8t9X2f"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col justify-between py-1">
                <div>
                  <h3 className="font-bold text-lg text-[#232c51]">宽窄巷子</h3>
                  <div className="flex items-center text-[#515981] text-xs mt-1">
                    <span className="material-symbols-outlined text-[14px] mr-1">location_on</span>
                    <span>距离上一个地点 8km</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="bg-[#ff9817]/10 text-[#884d00] text-[10px] px-2 py-1 rounded-md font-bold">休闲漫步</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* AI Assistant Banner */}
      <div className="px-6 mt-8">
         <div className="bg-[#f0f2ff] rounded-2xl p-4 flex items-center justify-between border border-[#6c9fff]/30">
           <div className="flex items-center gap-3">
              <div className="bg-[#0058bb] w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0">
                 <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#232c51]">AI 行程管家</h4>
                <p className="text-xs text-[#515981] mt-0.5">需要调整时间或更改地点？</p>
              </div>
           </div>
           <Link to="/chat" className="bg-[#0058bb] text-white text-xs font-bold px-4 py-2 rounded-full active:scale-95 transition-transform">去沟通</Link>
         </div>
      </div>
      
    </main>
  );
}
