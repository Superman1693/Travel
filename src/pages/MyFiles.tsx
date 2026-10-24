import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyArtifacts, type ArtifactItem } from '../services';
import { BACKEND_ORIGIN } from '../utils/network';

/**
 * 修复 O22：产物可回溯页面。
 * 产物链接原先只通过一次 SSE 事件下发，客户端断连即丢失；本页面从持久化的产物索引里查，
 * 让用户事后仍能找回 AI 生成的行程单（在有效期内）。
 */
export default function MyFiles() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<ArtifactItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const list = await getMyArtifacts();
        if (!cancelled) {
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '加载文件失败');
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
  }, []);

  const formatSize = (size: number) => {
    if (!size || size <= 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <main className="bg-surface min-h-screen pb-28 text-on-surface">
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-surface-container-low px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline">我的文件</h1>
        <span className="text-sm text-on-surface-variant">{items.length} 个</span>
      </header>

      <section className="px-6 py-4 space-y-3">
        {loading && <p className="text-base text-on-surface-variant">正在加载文件...</p>}
        {error && <p className="text-base text-error">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl bg-surface-container-low p-5 text-base text-on-surface-variant">
            暂无可用文件。AI 生成的行程单会在有效期内出现在这里。
          </div>
        )}

        {items.map((item) => (
          <article
            key={item.artifactId}
            className="bg-surface-container-low rounded-2xl p-4 shadow-sm flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-primary text-2xl">
              {item.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-on-surface truncate">{item.name}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {formatSize(item.size)} · 生成于 {new Date(item.createdAt).toLocaleString('zh-CN')}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                有效期至 {new Date(item.expiresAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <a
              href={`${BACKEND_ORIGIN}${item.downloadUrl}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-full text-sm font-semibold bg-primary text-white whitespace-nowrap"
            >
              下载
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}
