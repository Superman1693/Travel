import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applyAfterSale, cancelOrder, getOrderDetail, payOrder, type OrderDetail } from '../services';

const STATUS_TEXT: Record<OrderDetail['status'], string> = {
  pending_payment: '待付款',
  pending_travel: '待出行',
  completed: '已完成',
  refund: '退款/售后',
  cancelled: '已取消',
};

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [isAfterSaleSubmitting, setIsAfterSaleSubmitting] = useState(false);
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [showAfterSaleSheet, setShowAfterSaleSheet] = useState(false);
  const [afterSaleReason, setAfterSaleReason] = useState('');

  // 修复 E33/D14：改为白名单判断，cancelled / refund / completed 均不可再取消
  const canCancel = useMemo(() => {
    if (!detail) return false;
    return detail.status === 'pending_payment' || detail.status === 'pending_travel';
  }, [detail]);

  const loadDetail = async () => {
    if (!orderId) {
      setError('缺少订单参数');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await getOrderDetail(Number(orderId));
      setDetail(result);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '加载订单详情失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDetail();
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!detail || !canCancel) return;
    setShowCancelSheet(true);
  };

  const submitCancelOrder = async () => {
    if (!detail || !canCancel) return;

    try {
      setIsCancelling(true);
      setError('');
      await cancelOrder(detail.orderId, '用户主动取消');
      await loadDetail();
      setShowCancelSheet(false);
    } catch (cancelErr) {
      const message = cancelErr instanceof Error ? cancelErr.message : '取消订单失败';
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayOrder = async () => {
    if (!detail || detail.status !== 'pending_payment') return;

    try {
      setIsPaying(true);
      setError('');
      await payOrder(detail.orderId);
      await loadDetail();
    } catch (payErr) {
      const message = payErr instanceof Error ? payErr.message : '支付失败';
      setError(message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleContactSupport = () => {
    if (!detail) return;
    const prompt = `你好，我需要订单协助。订单号：${detail.orderNo}，商品：${detail.productName}，当前状态：${STATUS_TEXT[detail.status]}。`;
    navigate(`/chat?prefill=${encodeURIComponent(prompt)}`);
  };

  const handleApplyAfterSale = async () => {
    // 修复 E33/D14：白名单判断，仅待出行/已完成可申请售后
    if (!detail || (detail.status !== 'pending_travel' && detail.status !== 'completed')) return;
    setAfterSaleReason(detail.cancelReason || '行程体验不佳，申请售后');
    setShowAfterSaleSheet(true);
  };

  const submitAfterSale = async () => {
    // 修复 E33/D14：白名单判断，仅待出行/已完成可申请售后
    if (!detail || (detail.status !== 'pending_travel' && detail.status !== 'completed')) return;

    const trimmed = afterSaleReason.trim();
    if (!trimmed) {
      setError('请填写售后原因');
      return;
    }

    try {
      setIsAfterSaleSubmitting(true);
      setError('');
      await applyAfterSale(detail.orderId, trimmed);
      await loadDetail();
      setShowAfterSaleSheet(false);
    } catch (afterSaleErr) {
      const message = afterSaleErr instanceof Error ? afterSaleErr.message : '申请售后失败';
      setError(message);
    } finally {
      setIsAfterSaleSubmitting(false);
    }
  };

  return (
    <main className="bg-surface min-h-screen pb-24 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/orders')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline">订单详情</h1>
        <span className="text-sm text-on-surface-variant">{detail ? STATUS_TEXT[detail.status] : '-'}</span>
      </header>

      <section className="px-6 py-5 space-y-4">
        {loading && <p className="text-base text-on-surface-variant">正在加载订单详情...</p>}
        {error && <p className="text-base text-error">{error}</p>}

        {!loading && detail && (
          <>
            <article className="bg-surface-container-low rounded-2xl p-4 shadow-sm">
              <div className="flex gap-4">
                <img
                  src={detail.productImage}
                  alt={detail.productName}
                  className="w-28 h-28 rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-on-surface line-clamp-2">{detail.productName}</h2>
                  <p className="text-sm text-on-surface-variant mt-1">订单号 {detail.orderNo}</p>
                  <p className="text-sm text-on-surface-variant mt-1">下单时间 {new Date(detail.createTime).toLocaleString('zh-CN')}</p>
                  <p className="text-2xl font-black text-on-surface mt-2">¥{detail.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </article>

            <article className="bg-surface-container-low rounded-2xl p-4 shadow-sm space-y-2.5">
              <h3 className="text-base font-bold">出行信息</h3>
              <p className="text-sm text-on-surface-variant">出行人数：{detail.travelers} 人</p>
              <p className="text-sm text-on-surface-variant">出发日期：{detail.startDate}</p>
              <p className="text-sm text-on-surface-variant">联系人：{detail.contactName}</p>
              <p className="text-sm text-on-surface-variant">联系电话：{detail.contactPhone}</p>
              {detail.cancelReason && <p className="text-sm text-error">取消原因：{detail.cancelReason}</p>}
            </article>

            <article className="bg-surface-container-low rounded-2xl p-4 shadow-sm space-y-2.5">
              <h3 className="text-base font-bold">订单状态</h3>
              <p className="text-sm text-on-surface-variant">当前状态：{STATUS_TEXT[detail.status]}</p>
              {detail.status === 'pending_payment' && (
                <button
                  type="button"
                  onClick={handlePayOrder}
                  disabled={isPaying}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary text-white disabled:opacity-60"
                >
                  {isPaying ? '支付中...' : '去支付'}
                </button>
              )}

              <button
                type="button"
                onClick={handleContactSupport}
                className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-surface border border-surface-container text-on-surface"
              >
                联系客服
              </button>

              {(detail.status === 'pending_travel' || detail.status === 'completed') && (
                <button
                  type="button"
                  onClick={handleApplyAfterSale}
                  disabled={isAfterSaleSubmitting}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-secondary/10 text-secondary border border-secondary/30 disabled:opacity-60"
                >
                  {isAfterSaleSubmitting ? '提交中...' : '申请退款/售后'}
                </button>
              )}

              {canCancel ? (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="w-full mt-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-error text-white disabled:opacity-60"
                >
                  {isCancelling ? '取消中...' : '取消订单'}
                </button>
              ) : (
                <p className="text-sm text-on-surface-variant">当前状态不可取消</p>
              )}
            </article>
          </>
        )}
      </section>

      {showCancelSheet && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end" onClick={() => setShowCancelSheet(false)}>
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
                onClick={() => setShowCancelSheet(false)}
              >
                再想想
              </button>
              <button
                type="button"
                onClick={submitCancelOrder}
                disabled={isCancelling}
                className="px-4 py-2.5 rounded-xl bg-error text-white text-sm font-bold disabled:opacity-60"
              >
                {isCancelling ? '处理中...' : '确认取消'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAfterSaleSheet && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-end" onClick={() => setShowAfterSaleSheet(false)}>
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
                onClick={() => setShowAfterSaleSheet(false)}
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitAfterSale}
                disabled={isAfterSaleSubmitting}
                className="px-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold disabled:opacity-60"
              >
                {isAfterSaleSubmitting ? '提交中...' : '提交申请'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}