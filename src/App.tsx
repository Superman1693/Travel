/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import RequireAuth from './components/RequireAuth';

// 修复 O17：按路由做代码分割（React.lazy + Suspense），避免首屏一次性加载全部页面。
// 原先 19 个页面全部同步 import，首屏包体偏大；改为懒加载后仅按需加载当前路由。
const Home = lazy(() => import('./pages/Home'));
const Itinerary = lazy(() => import('./pages/Itinerary'));
const Chat = lazy(() => import('./pages/Chat'));
const Detail = lazy(() => import('./pages/Detail'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const PersonalInfo = lazy(() => import('./pages/PersonalInfo'));
const AccountSecurity = lazy(() => import('./pages/AccountSecurity'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Destinations = lazy(() => import('./pages/Destinations'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Agent = lazy(() => import('./pages/Agent'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search = lazy(() => import('./pages/Search'));
const MyFiles = lazy(() => import('./pages/MyFiles'));
const Trace = lazy(() => import('./pages/Trace'));
// 行程分享公开页：不包 RequireAuth，无需登录
const ShareItinerary = lazy(() => import('./pages/ShareItinerary'));
const NotFound = lazy(() => import('./pages/NotFound'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
      <span className="text-sm">加载中...</span>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const hideBottomNav =
    location.pathname === '/forgot-password' ||
    location.pathname === '/search' ||
    // 分享公开页使用简版布局，不展示底部导航
    location.pathname.startsWith('/share/');

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Suspense fallback={<RouteFallback />}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/itinerary" element={<RequireAuth><Itinerary /></RequireAuth>} />
        <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/agent" element={<RequireAuth><Agent /></RequireAuth>} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/settings/personal-info" element={<RequireAuth><PersonalInfo /></RequireAuth>} />
        <Route path="/settings/account-security" element={<RequireAuth><AccountSecurity /></RequireAuth>} />
        <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="/orders/:orderId" element={<RequireAuth><OrderDetail /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/search" element={<Search />} />
        <Route path="/my-files" element={<RequireAuth><MyFiles /></RequireAuth>} />
        <Route path="/trace" element={<RequireAuth><Trace /></RequireAuth>} />
        {/* 分享页在 RequireAuth 之外：公开访问，仅只读 */}
        <Route path="/share/:token" element={<ShareItinerary />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
