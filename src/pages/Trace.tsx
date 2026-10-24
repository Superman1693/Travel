import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAgentTrace, type AgentTraceItem } from '../services';

/**
 * 修复 O23：Agent 完整过程回溯页。
 * 前端收到的 thought 事件被摘要化（>120 字截断），本页展示落库的完整 trace，
 * 既提升可解释性，也便于线上排障。需后端开启 app.trace.persist-enabled 并建表。
 */
export default function Trace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId') || '';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<AgentTraceItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!runId) {
        setError('缺少 runId 参数');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const list = await getAgentTrace(runId);
        if (!cancelled) {
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '加载完整过程失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const eventLabel: Record<string, string> = {
    thought: '思考',
    tool_call: '工具调用',
    tool_result: '工具结果',
    artifact: '产物',
    final: '最终结果',
    done: '结束',
    error: '错误',
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline">完整过程</h1>
        <span className="text-sm text-on-surface-variant">{items.length} 条</span>
      </header>

      <section className="px-6 py-4 space-y-3">
        <p className="text-xs text-on-surface-variant break-all">runId：{runId || '-'}</p>

        {loading && <p className="text-base text-on-surface-variant">正在加载完整过程...</p>}
        {error && <p className="text-base text-error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl bg-surface-container-low p-5 text-base text-on-surface-variant">
            未找到过程记录。可能未开启落库（app.trace.persist-enabled），或该任务记录已被清理。
          </div>
        )}

        {items.map((item) => (
          <article key={item.id} className="bg-surface-container-low rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary-container/45 text-primary">
                Step {item.step} · {eventLabel[item.eventType] || item.eventType}
              </span>
              <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{item.createTime}</span>
            </div>
            <pre className="text-xs text-on-surface-variant whitespace-pre-wrap break-all font-mono">
              {item.content}
            </pre>
          </article>
        ))}
      </section>
    </main>
  );
}
