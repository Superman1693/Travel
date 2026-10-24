import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyAfterSale, cancelOrder, getOrderList, type Order } from '../services';

// 修复 E33/D14：新增 cancelled 状态，与后端订单状态机保持一致
type OrderStatus = 'all' | 'pending_payment' | 'pending_travel' | 'completed' | 'refund' | 'cancelled';

const STATUS_TABS: Array<{ key: OrderStatus; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending_payment', label: '待付款' },
  { key: 'pending_travel', label: '待出行' },
  { key: 'completed', label: '已完成' },
  { key: 'refund', label: '退款/售后' },
  { key: 'cancelled', label: '已取消' },
];

const STATUS_TEXT: Record<Exclude<OrderStatus, 'all'>, string> = {
  pending_payment: '待付款',
  pending_travel: '待出行',
  completed: '已完成',
  refund: '退款/售后',
  cancelled: '已取消',
};

const isValidStatus = (raw: string | null): raw is OrderStatus => {
  return (
    raw === 'all' ||
    raw === 'pending_payment' ||
    raw === 'pending_travel' ||
    raw === 'completed' ||
    raw === 'refund' ||
    raw === 'cancelled'
  );
};

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [afterSaleId, setAfterSaleId] = useState<number | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [afterSaleTargetId, setAfterSaleTargetId] = useState<number | null>(null);
  const [afterSaleReason, setAfterSaleReason] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 10;

  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const currentStatus = isValidStatus(search.get('status')) ? (search.get('status') as OrderStatus) : 'all';

  const loadOrders = async (status: OrderStatus, pageNum: number, append: boolean) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
      }
      const result = await getOrderList(status === 'all' ? undefined : status, pageNum, pageSize);
      const list = result.list || [];
      setOrders((prev) => (append ? [...prev, ...list] : list));
      setHasMore(list.length >= pageSize);
      setPage(pageNum);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '加载订单失败';
      setError(message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 竞态守卫：切换筛选时若上一次请求未返回，cleanup 置 cancelled，防止过期结果覆盖新数据
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const result = await getOrderList(currentStatus === 'all' ? undefined : currentStatus, 1, pageSize);
        if (cancelled) return;
        const list = result.list || [];
        setOrders(list);
        setHasMore(list.length >= pageSize);
        setPage(1);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : '加载订单失败';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentStatus]);

  const handleCancel = async (orderId: number) => {
    setCancelTargetId(orderId);
  };

  const submitCancel = async () => {
    if (!cancelTargetId) return;

    try {
      setCancellingId(cancelTargetId);
      setError('');
      await cancelOrder(cancelTargetId, '用户在订单列表取消');
      await loadOrders(currentStatus, 1, false);
      setCancelTargetId(null);
    } catch (cancelErr) {
      const message = cancelErr instanceof Error ? cancelErr.message : '取消订单失败';
      setError(message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleAfterSale = async (orderId: number) => {
    setAfterSaleTargetId(orderId);
    setAfterSaleReason('行程变更，申请售后');
  };

  const submitAfterSale = async () => {
    if (!afterSaleTargetId) return;
    const trimmed = afterSaleReason.trim();
    if (!trimmed) {
      setError('请填写售后原因');
      return;
    }

    try {
      setAfterSaleId(afterSaleTargetId);
      setError('');
      await applyAfterSale(afterSaleTargetId, trimmed);
      await loadOrders(currentStatus, 1, false);
      setAfterSaleTargetId(null);
      setAfterSaleReason('');
    } catch (afterErr) {
      const message = afterErr instanceof Error ? afterErr.message : '申请售后失败';
      setError(message);
    } finally {
      setAfterSaleId(null);
    }
  };

  const gotoStatus = (status: OrderStatus) => {
    navigate(status === 'all' ? '/orders' : `/orders?status=${status}`);
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline">我的订单</h1>
        <span className="text-sm text-on-surface-variant">{orders.length} 条</span>
      </header>

      <section className="px-6 py-4">
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => gotoStatus(tab.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap ${
                currentStatus === tab.key
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-base text-on-surface-variant">正在加载订单...</p>}
        {error && <p className="text-base text-error">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl bg-surface-container-low p-5 text-base text-on-surface-variant">
            当前筛选下暂无订单。
          </div>
        )}

        <div className="space-y-4">
          {orders.map((item) => (
            <article key={item.orderId} className="bg-surface-container-low rounded-2xl p-4 shadow-sm">
              <div className="flex gap-3">
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-24 h-24 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-on-surface line-clamp-2">{item.productName}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary-container/45 text-primary whitespace-nowrap">
                      {STATUS_TEXT[item.status]}
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant mt-1">订单号 {item.orderNo}</p>
                  <p className="text-sm text-on-surface-variant mt-0.5">下单时间 {new Date(item.createTime).toLocaleString('zh-CN')}</p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="text-lg font-bold text-on-surface">¥{item.totalAmount.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/orders/${item.orderId}`)}
                        className="px-3 py-1.5 rounded-full text-sm font-semibold bg-surface border border-surface-container text-on-surface-variant"
                      >
                        详情
                      </button>
                      {(item.status === 'pending_payment' || item.status === 'pending_travel') && (
                        <button
                          type="button"
                          onClick={() => handleCancel(item.orderId)}
                          disabled={cancellingId === item.orderId}
                          className="px-3 py-1.5 rounded-full text-sm font-semibold bg-error/10 text-error border border-error/30 disabled:opacity-60"
                        >
                          {cancellingId === item.orderId ? '取消中...' : '取消订单'}
                        </button>
                      )}
                      {(item.status === 'pending_travel' || item.status === 'completed') && (
                        <button
                          type="button"
                          onClick={() => handleAfterSale(item.orderId)}
                          disabled={afterSaleId === item.orderId}
                          className="px-3 py-1.5 rounded-full text-sm font-semibold bg-secondary/10 text-secondary border border-secondary/30 disabled:opacity-60"
                        >
                          {afterSaleId === item.orderId ? '提交中...' : '申请售后'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {hasMore && !loading && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={() => loadOrders(currentStatus, page + 1, true)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-full bg-surface-container-low text-on-surface-variant text-sm font-semibold hover:bg-surface-container transition-colors disabled:opacity-60"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </button>
          </div>
        )}
      </section>

      {cancelTargetId !== null && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end" onClick={() => setCancelTargetId(null)}>
          <div
            className="w-full rounded-t-3xl bg-surface border-t border-surface-container p-5 shadow-[0_-8px_28px_rgba(35,44,81,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-on-surface">确认取消订单？</h3>
            <p className="text-sm text-on-surface-variant mt-1">取消后订单将标记为「已取消」，如需退款请另行申请售后。</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm font-semibold"
                onClick={() => setCancelTargetId(null)}
              >
                再想想
              </button>
              <button
                type="button"
                onClick={submitCancel}
                disabled={cancellingId === cancelTargetId}
                className="px-4 py-2.5 rounded-xl bg-error text-white text-sm font-bold disabled:opacity-60"
              >
                {cancellingId === cancelTargetId ? '处理中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}

      {afterSaleTargetId !== null && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end" onClick={() => setAfterSaleTargetId(null)}>
          <div
            className="w-full rounded-t-3xl bg-surface border-t border-surface-container p-5 shadow-[0_-8px_28px_rgba(35,44,81,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-on-surface">申请退款/售后</h3>
            <p className="text-sm text-on-surface-variant mt-1">请说明问题，客服会尽快处理。</p>
            <textarea
              className="mt-3 w-full rounded-xl border border-surface-container-low bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none min-h-[96px]"
              maxLength={200}
              value={afterSaleReason}
              onChange={(e) => setAfterSaleReason(e.target.value)}
              placeholder="例如：行程变动、体验不符、服务问题等"
            />
            <p className="text-xs text-on-surface-variant mt-1 text-right">{afterSaleReason.length}/200</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="px-4 py-2.5 rounded-xl bg-surface-container-low text-on-surface text-sm font-semibold"
                onClick={() => setAfterSaleTargetId(null)}
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitAfterSale}
                disabled={afterSaleId === afterSaleTargetId}
                className="px-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold disabled:opacity-60"
              >
                {afterSaleId === afterSaleTargetId ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
