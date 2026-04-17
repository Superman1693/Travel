import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // Hide BottomNav on Detail view
  if (location.pathname.startsWith('/detail')) {
    return null;
  }

  const getNavClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    if (isActive) {
      return "flex flex-col items-center justify-center bg-[#efefff] text-[#0058bb] rounded-full px-4 py-1 active:scale-90 transition-transform duration-200 z-50";
    }
    return "flex flex-col items-center justify-center text-[#515981] hover:text-[#0058bb] transition-colors active:scale-90 transition-transform duration-200 z-50";
  };

  const getIconStatus = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <nav className="fixed bottom-0 w-full z-40 rounded-t-[1.5rem] bg-white/70 backdrop-blur-2xl shadow-[0_-12px_32px_rgba(35,44,81,0.06)] flex justify-around items-center pt-3 pb-8 px-4">
      <Link to="/" className={getNavClass('/')}>
        <span className="material-symbols-outlined mb-1" style={getIconStatus('/')}>explore</span>
        <span className="font-['Inter','PingFang_SC'] text-[12px] font-medium leading-[1.2]">首页</span>
      </Link>
      <Link to="/chat" className={getNavClass('/chat')}>
        <span className="material-symbols-outlined mb-1" style={getIconStatus('/chat')}>smart_toy</span>
        <span className="font-['Inter','PingFang_SC'] text-[12px] font-medium leading-[1.2]">AI助手</span>
      </Link>
      <Link to="/itinerary" className={getNavClass('/itinerary')}>
        <span className="material-symbols-outlined mb-1" style={getIconStatus('/itinerary')}>event_note</span>
        <span className="font-['Inter','PingFang_SC'] text-[12px] font-medium leading-[1.2]">行程</span>
      </Link>
      <Link to="/profile" className={getNavClass('/profile')}>
        <span className="material-symbols-outlined mb-1" style={getIconStatus('/profile')}>person</span>
        <span className="font-['Inter','PingFang_SC'] text-[12px] font-medium leading-[1.2]">我的</span>
      </Link>
    </nav>
  );
}
