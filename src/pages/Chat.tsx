import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Chat() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  
  // Typewriter effect state
  const fullText = "好的，带父母去成都是个不错的选择！考虑到长辈的体力，我为您安排了节奏适中的经典行程，以体验文化和美食为主：";
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 50); // Adjust typing speed here
    return () => clearInterval(intervalId);
  }, [fullText]);

  return (
    <main className="flex flex-col h-screen bg-surface text-on-surface font-body relative">
      {/* TopAppBar */}
      <header className="flex justify-between items-center px-4 py-4 bg-surface/90 backdrop-blur-md z-30 sticky top-0 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant cursor-pointer">
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm relative">
               <span className="material-symbols-outlined text-[24px]" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
               <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-fixed rounded-full border-2 border-surface"></div>
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline leading-none text-on-surface">小灵</h1>
              <span className="text-xs text-on-surface-variant font-medium">您的智能行程助理</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-on-surface-variant w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">more_vert</span>
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute top-12 right-0 w-40 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-low overflow-hidden z-50">
              <button 
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-on-surface flex items-center gap-2"
                onClick={() => setShowMenu(false)}
              >
                <span className="material-symbols-outlined text-[18px]">add_comment</span>
                新建对话
              </button>
              <button 
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-on-surface flex items-center gap-2 border-t border-surface-container-low"
                onClick={() => setShowMenu(false)}
              >
                <span className="material-symbols-outlined text-[18px]">history</span>
                查看历史对话
              </button>
              <button 
                className="w-full px-4 py-3 text-left text-sm font-medium hover:bg-surface-container-low transition-colors text-error flex items-center gap-2 border-t border-surface-container-low"
                onClick={() => setShowMenu(false)}
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                删除对话
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 flex flex-col pb-36">
        {/* System Time */}
        <div className="text-center">
          <span className="bg-surface-container-low text-on-surface-variant text-[11px] px-3 py-1 rounded-full font-medium">今天 10:24 AM</span>
        </div>

        {/* Bot Message */}
        <div className="flex gap-3 max-w-[85%]">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
               <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm">
                嗨！我是小灵，您的专属行程助理。您想去哪里旅行？或者需要我帮您规划成都的行程吗？
              </div>
              {/* Suggetions */}
              <div className="flex flex-wrap gap-2 mt-1">
                <button className="border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors active:scale-95 bg-surface cursor-pointer">帮我规划成都三日游</button>
                <button className="border border-outline-variant text-primary text-xs px-3 py-1.5 rounded-full hover:bg-primary-container/30 transition-colors active:scale-95 bg-surface cursor-pointer">推荐周末短途游</button>
              </div>
            </div>
        </div>

        {/* User Message */}
        <div className="flex gap-3 max-w-[85%] self-end flex-row-reverse">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
              <img 
                className="w-full h-full object-cover" 
                alt="User" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCNrwIUsVv00-3TzaxasKMLadmcPhK1MtWRH1WeKvCKQLd66E3LELr5sOiJpDCWtI1U_XVTk7NY690JjkelfF3WwHpyOYpaGSHf7cb5tjL0r-M8Lv1ocNJHtcKmBaUN-4r2oeHVmo0BmdDUZdDdYGqsbcVsHyU1CBHAj4rgxNsSpBUYq6f_gaa0m1WTHeDcAf3YZrYoQmvE34x_bXpZbb6pedKao0HO7WY5mOHNA5-hSgDaHrKVE0vO6gOJ6qGtOVaQ1v9SlJzm7ko"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed shadow-md">
              帮我规划一个去成都的三日游，要求带父母，行程不要太赶。
            </div>
        </div>

        {/* Bot Message with Card */}
        <div className="flex gap-3 max-w-[90%]">
           <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 mt-1">
               <span className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>smart_toy</span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="bg-surface-container-low text-on-surface p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed shadow-sm relative min-h-[3rem]">
                {displayedText}
                {isTyping && <span className="inline-block w-1.5 h-3.5 bg-primary ml-1 align-middle animate-pulse"></span>}
              </div>
              
              {/* Inline Rich Card - Fade in after typing */}
              {!isTyping && (
                <Link to="/itinerary" className="bg-surface-container-lowest border border-surface-container-high rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-all block mt-1 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="h-32 relative">
                    <img 
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB26A0Neyq5Yp2eP4I844z64Z0dGg2z7Lp-F9A5CqM7G6_bS4X1T_T7i4m_m0b8Vb4x9r818p7e3N60NlD_bW6ZfE9c90I3gP6Zp0PjL0C2c2h3I7M1h3S7m5uO7e6tI1bZ7u8Z4x1g9P5h5c7r7p3S9X2H5o8T8w8j9S6T7u2o4G7E8Z6p5q2v1k5e9x7v8P6d5m6X7w1G4V6e8B6g0s7Q8v3n4X7T7v9J9S9T7w9O6B8_F3r3F9O8z5R4x6U3C1v6B9D0F3c0C5L6r4U0C"
                      alt="Chengdu Itinerary"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 text-white">
                      <span className="text-[10px] font-bold bg-primary/80 px-2 py-0.5 rounded-sm mb-1 inline-block">行程草案</span>
                      <h3 className="font-bold text-sm">成都慢时光三日游</h3>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[14px]">map</span> 大熊猫基地 / 宽窄巷子 / 武侯祠...
                    </p>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-surface-container-low">
                      <span className="text-xs font-semibold text-primary">点击查看详细路线</span>
                      <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              )}
              
            </div>
        </div>

      </div>

      {/* Input Area */}
      <div className="bg-surface/80 backdrop-blur-xl border-t border-surface-container px-4 py-3 fixed bottom-0 w-full z-40 pb-safe">
        <div className="flex items-end gap-2 bg-surface-container-low rounded-[1.5rem] p-2 focus-within:ring-2 ring-primary/30 transition-shadow">
          <button className="w-10 h-10 flex flex-shrink-0 items-center justify-center text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-highest rounded-full active:scale-95 cursor-pointer">
             <span className="material-symbols-outlined">add_circle</span>
          </button>
          <textarea 
            className="w-full bg-transparent border-none outline-none resize-none max-h-32 min-h-[40px] py-2.5 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/70 no-scrollbar self-center" 
            placeholder="输入您想去的地方或需求..."
            rows={1}
          />
          <button className="w-10 h-10 flex flex-shrink-0 items-center justify-center bg-primary rounded-full text-white shadow-md active:scale-90 transition-transform mb-0.5 self-end cursor-pointer">
             <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>arrow_upward</span>
          </button>
        </div>
      </div>
    </main>
  );
}
