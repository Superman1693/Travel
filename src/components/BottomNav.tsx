import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  // Hide BottomNav on full-screen pages
  if (
    location.pathname.startsWith('/detail') ||
    location.pathname.startsWith('/chat') ||
    location.pathname.startsWith('/agent') ||
    location.pathname === '/login' ||
    location.pathname === '/register'
  ) {
    return null;
  }

  const isActivePath = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  const getNavClass = (path: string) => {
    if (isActivePath(path)) {
      return "flex flex-col items-center justify-center bg-surface-container text-primary rounded-full px-3 py-1 active:scale-90 transition-transform duration-200 z-50";
    }
    return "flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors active:scale-90 transition-transform duration-200 z-50";
  };

  const getIconStatus = (path: string) => {
    return isActivePath(path) ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <nav aria-label="底部导航" className="fixed bottom-0 w-full z-40 rounded-t-[1.1rem] bg-surface/85 backdrop-blur-2xl border-t border-surface-container shadow-[0_-8px_18px_rgba(18,25,50,0.08)] flex justify-around items-center pt-2 pb-4 px-3">
      <Link to="/" aria-current={isActivePath('/') ? 'page' : undefined} className={getNavClass('/')}>
        <span className="material-symbols-outlined mb-0.5" style={getIconStatus('/')}>explore</span>
        <span className="font-['Inter','PingFang_SC'] text-[11px] font-medium leading-[1.1]">首页</span>
      </Link>
      <Link to="/agent" aria-current={isActivePath('/agent') ? 'page' : undefined} className={getNavClass('/agent')}>
        <span className="material-symbols-outlined mb-0.5" style={getIconStatus('/agent')}>psychology</span>
        <span className="font-['Inter','PingFang_SC'] text-[11px] font-medium leading-[1.1]">AI助手</span>
      </Link>
      <Link to="/itinerary" aria-current={isActivePath('/itinerary') ? 'page' : undefined} className={getNavClass('/itinerary')}>
        <span className="material-symbols-outlined mb-0.5" style={getIconStatus('/itinerary')}>event_note</span>
        <span className="font-['Inter','PingFang_SC'] text-[11px] font-medium leading-[1.1]">行程</span>
      </Link>
      <Link to="/profile" aria-current={isActivePath('/profile') ? 'page' : undefined} className={getNavClass('/profile')}>
        <span className="material-symbols-outlined mb-0.5" style={getIconStatus('/profile')}>person</span>
        <span className="font-['Inter','PingFang_SC'] text-[11px] font-medium leading-[1.1]">我的</span>
      </Link>
    </nav>
  );
}
