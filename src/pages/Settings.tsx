import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <main className="font-body text-on-surface bg-surface min-h-screen pb-12 flex flex-col">
      {/* TopAppBar */}
      <header className="flex items-center px-4 py-4 bg-surface/90 backdrop-blur-md sticky top-0 z-30">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:scale-95 transition-colors text-on-surface-variant mr-2"
        >
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-bold font-headline text-on-surface">设置</h1>
      </header>

      <div className="px-6 py-4 space-y-6">
        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">账号与安全</h3>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low">
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low">
               <span className="font-medium text-sm">个人信息</span>
               <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low">
               <span className="font-medium text-sm">账号与绑定</span>
               <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left">
               <span className="font-medium text-sm">修改密码</span>
               <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">偏好设置</h3>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low">
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low">
               <span className="font-medium text-sm">消息通知</span>
               <div className="flex items-center gap-1">
                 <span className="text-xs text-on-surface-variant">已开启</span>
                 <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
               </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low">
               <span className="font-medium text-sm">语言</span>
               <div className="flex items-center gap-1">
                 <span className="text-xs text-on-surface-variant">简体中文</span>
                 <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
               </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left">
               <span className="font-medium text-sm">深色模式</span>
               <div className="flex items-center gap-1">
                 <span className="text-xs text-on-surface-variant">跟随系统</span>
                 <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
               </div>
            </button>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 px-2">关于</h3>
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-surface-container-low">
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left border-b border-surface-container-low">
               <span className="font-medium text-sm">隐私政策</span>
               <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-surface-container-low active:bg-surface-container transition-colors text-left">
               <span className="font-medium text-sm">关于应用</span>
               <div className="flex items-center gap-1">
                 <span className="text-xs text-on-surface-variant">v1.0.0</span>
                 <span className="material-symbols-outlined text-outline-variant text-[20px]">chevron_right</span>
               </div>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
