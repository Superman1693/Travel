import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';

import defaultAvatar from '../assets/unnamed.png'
import { getOrderList, type Order } from '../services';
import { getCurrentUser, uploadAvatar, User } from '../services/user';

export default function Profile() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const fallbackAvatar = useMemo(() => defaultAvatar, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const cachedUser = localStorage.getItem('userInfo');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser) as User);
      } catch {
        localStorage.removeItem('userInfo');
      }
    }

    const fetchCurrentUser = async () => {
      try {
        const latestUser = await getCurrentUser();
        setUser(latestUser);
        localStorage.setItem('userInfo', JSON.stringify(latestUser));
      } catch (error) {
        const message = error instanceof Error ? error.message : '获取用户信息失败';
        setUserError(message);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchCurrentUser();

    const fetchOrders = async () => {
      try {
        setIsLoadingOrders(true);
        setOrderError('');
        const orderResult = await getOrderList(undefined, 1, 100);
        setOrderList(orderResult.list || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : '获取订单失败';
        setOrderError(message);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [navigate]);

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAvatarError('请选择图片文件');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('图片大小不能超过 5MB');
      event.target.value = '';
      return;
    }

    try {
      setAvatarError('');
      setIsUploadingAvatar(true);
      const updatedUser = await uploadAvatar(file);
      setUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error) {
      const message = error instanceof Error ? error.message : '头像上传失败';
      setAvatarError(message);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const displayName = user?.username || '未登录用户';
  const displayRole = user?.role === 'admin' ? '管理员' : '普通用户';
  const displayEmail = user?.email || '暂未设置邮箱';
  const pendingPaymentCount = orderList.filter((item) => item.status === 'pending_payment').length;
  const pendingTravelCount = orderList.filter((item) => item.status === 'pending_travel').length;
  const completedCount = orderList.filter((item) => item.status === 'completed').length;
  const refundCount = orderList.filter((item) => item.status === 'refund').length;
  // 修复 E33/D14：取消订单使用独立状态 cancelled，单独统计
  const cancelledCount = orderList.filter((item) => item.status === 'cancelled').length;

  const gotoOrders = (status?: string) => {
    navigate(status ? `/orders?status=${status}` : '/orders');
  };
  return (
    <main className="font-body text-on-surface antialiased pb-28 min-h-screen px-6 pt-4 flex flex-col gap-8 bg-surface relative">
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] bg-inverse-surface text-inverse-on-surface text-sm px-4 py-2 rounded-full shadow-lg">
          {toastMessage}
        </div>
      )}
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-30 bg-surface/90 border-b border-surface-container font-['Plus_Jakarta_Sans'] font-bold tracking-tight backdrop-blur-md">
        <div className="flex justify-between items-center py-4 w-full">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="text-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center -ml-2 cursor-pointer"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-bold text-on-surface">我的</h1>
          <Link to="/settings" className="text-primary hover:bg-surface-container-low transition-colors active:scale-95 duration-200 p-2 rounded-full flex items-center justify-center -mr-2">
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </header>

      {/* Profile Header Area */}
      <section className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_rgba(35,44,81,0.06)] flex items-center gap-6 relative overflow-hidden">
        {/* Decorative Gradient Blob */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br from-primary-container to-surface opacity-50 blur-2xl"></div>
        <button
          type="button"
          onClick={handleAvatarClick}
          disabled={isUploadingAvatar}
          className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-4 border-surface-container-low shadow-sm z-10 relative active:scale-95 transition-all disabled:opacity-70"
          aria-label="上传头像"
          title="点击上传头像"
        >
          <img 
            className="w-full h-full object-cover" 
            alt="Profile portrait" 
            src={user?.avatarUrl || fallbackAvatar}
            referrerPolicy="no-referrer"
          />
          {isUploadingAvatar && (
            <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-[11px] font-semibold">
              上传中
            </span>
          )}
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div className="flex flex-col z-10">
          <h2 className="font-headline text-2xl text-on-surface mb-1">{displayName}</h2>
          <p className="text-xs text-on-surface-variant mb-2">{displayEmail}</p>
          <div>
            <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: "'FILL' 1"}}>verified</span>
              {displayRole}
            </span>
          </div>
        </div>
      </section>

      {isLoadingUser && (
        <section className="bg-surface-container-lowest rounded-xl p-4 text-sm text-on-surface-variant">
          正在同步用户信息...
        </section>
      )}

      {userError && (
        <section className="bg-surface-container-lowest rounded-xl p-4 text-sm text-error font-medium">
          {userError}
        </section>
      )}

      {avatarError && (
        <section className="bg-surface-container-lowest rounded-xl p-4 text-sm text-error font-medium">
          {avatarError}
        </section>
      )}

      {(isLoadingOrders || orderError) && (
        <section className="bg-surface-container-lowest rounded-xl p-4 text-sm text-on-surface-variant">
          {isLoadingOrders ? '正在加载订单数据...' : orderError}
        </section>
      )}

      {/* My Orders */}
      <section>
        <h3 className="font-headline text-xl text-on-surface mb-4 px-2 font-bold tracking-wider">我的订单</h3>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_12px_32px_rgba(35,44,81,0.06)]">
          <div className="grid grid-cols-5 gap-1">
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95" onClick={() => gotoOrders('pending_payment')}>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">account_balance_wallet</span>
              </div>
              <span className="text-base font-medium text-on-surface-variant group-hover:text-primary transition-colors">待付款{pendingPaymentCount > 0 ? ` (${pendingPaymentCount})` : ''}</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95" onClick={() => gotoOrders('pending_travel')}>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300 relative">
                {pendingTravelCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-surface-container-lowest"></span>}
                <span className="material-symbols-outlined text-primary text-2xl">flight_takeoff</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">待出行{pendingTravelCount > 0 ? ` (${pendingTravelCount})` : ''}</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95" onClick={() => gotoOrders('completed')}>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">task_alt</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">已完成{completedCount > 0 ? ` (${completedCount})` : ''}</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95" onClick={() => gotoOrders('refund')}>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">currency_exchange</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">退款/售后{refundCount > 0 ? ` (${refundCount})` : ''}</span>
            </button>
            <button className="flex flex-col items-center gap-3 group cursor-pointer active:scale-95" onClick={() => gotoOrders('cancelled')}>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center group-hover:bg-primary-container transition-colors duration-300">
                <span className="material-symbols-outlined text-primary text-2xl">cancel</span>
              </div>
              <span className="text-xs font-medium text-on-surface-variant group-hover:text-primary transition-colors text-center leading-tight">已取消{cancelledCount > 0 ? ` (${cancelledCount})` : ''}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Quick Actions (Bento Grid) */}
      <section>
        <h3 className="font-headline text-lg text-on-surface mb-4 px-2 font-bold tracking-wider">常用工具</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95"
            onClick={() => navigate('/favorites')}
          >
            <span className="material-symbols-outlined text-secondary text-2xl bg-secondary-container/30 p-2 rounded-full">favorite</span>
            <span className="font-medium text-on-surface text-sm">收藏</span>
          </button>
          <button
            className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95"
            onClick={() => navigate('/my-files')}
          >
            <span className="material-symbols-outlined text-primary text-2xl bg-primary-container/20 p-2 rounded-full">folder_open</span>
            <span className="font-medium text-on-surface text-sm">我的文件</span>
          </button>
          <button onClick={() => showToast('点评功能开发中')} className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-tertiary-container text-2xl bg-tertiary-container/10 p-2 rounded-full">rate_review</span>
            <span className="font-medium text-on-surface text-sm">点评</span>
          </button>
          <button onClick={() => showToast('旅客管理功能开发中')} className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-primary text-2xl bg-primary-container/20 p-2 rounded-full">group</span>
            <span className="font-medium text-on-surface text-sm">旅客</span>
          </button>
          <button onClick={() => showToast('优惠券功能开发中')} className="bg-surface-container-lowest rounded-xl p-5 flex items-center gap-4 shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-95">
            <span className="material-symbols-outlined text-tertiary text-2xl bg-tertiary/10 p-2 rounded-full">confirmation_number</span>
            <span className="font-medium text-on-surface text-sm">优惠券</span>
          </button>
          <button onClick={() => showToast('帮助中心功能开发中')} className="col-span-2 bg-surface-container-lowest rounded-xl p-5 flex items-center justify-between shadow-[0_12px_32px_rgba(35,44,81,0.06)] hover:bg-surface-container-low transition-colors duration-300 text-left cursor-pointer active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-outline text-2xl bg-surface-container p-2 rounded-full">support_agent</span>
              <span className="font-medium text-on-surface text-sm">帮助中心</span>
            </div>
            <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
          </button>
        </div>
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
            <button onClick={() => { showToast('钱包功能开发中'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-primary-container hover:text-primary-dim rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">account_balance_wallet</span>
              我的钱包
            </button>
            <button onClick={() => { showToast('实名认证功能开发中'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-primary-container hover:text-primary-dim rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">verified_user</span>
              实名认证
            </button>
            <button onClick={() => { showToast('会员中心功能开发中'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-primary-container hover:text-primary-dim rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">card_membership</span>
              会员中心
            </button>
          </div>

          <div className="mx-6 my-4 h-px bg-surface-container-low"></div>

          <div className="space-y-1 px-3">
            <button onClick={() => { showToast('邀请好友功能开发中'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-surface-container-low rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
              <span className="material-symbols-outlined text-outline">person_add</span>
              邀请好友
            </button>
            <button onClick={() => { navigate('/chat'); setIsMenuOpen(false); }} className="w-full flex items-center gap-4 px-4 py-3.5 text-on-surface hover:bg-surface-container-low rounded-xl transition-colors active:scale-95 text-left font-medium cursor-pointer">
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
