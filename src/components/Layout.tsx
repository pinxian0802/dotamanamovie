import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { clsx } from 'clsx';
import { CheckCircle2, Circle, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import TechBackground from './TechBackground';

const GEM_STEPS = [
  { id: 1, path: '/step1', label: '故事與概念發想' },
  { id: 2, path: '/step2', label: '角色概念設計' },
  { id: 3, path: '/step3', label: '角色設計' },
  { id: 4, path: '/step4', label: '生成角色概念圖' },
  { id: 5, path: '/step5', label: '分鏡圖場景製作' },
  { id: 6, path: '/step6', label: '分鏡圖人物與場景製作' },
  { id: 7, path: '/step7', label: '動態影片生成' },
  { id: 8, path: '/step-music', label: '影片配樂' },
];

const PROMO_STEPS = [
  { id: 1, path: '/step2a', label: '產品解構與腳本大綱' },
  { id: 2, path: '/step3a', label: '產品視覺注入與首尾影格' },
  { id: 3, path: '/step4a', label: '動態插幀與影片生成' },
  { id: 4, path: '/step5a', label: 'AI 轉場縫合生成' },
  { id: 5, path: '/step-music', label: '影片配樂' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const currentStep = useProjectStore((state) => state.currentStep);
  const completedSteps = useProjectStore((state) => state.completedSteps);
  const workflowType = useProjectStore((state) => state.workflowType);

  const currentSteps = workflowType === 'promo' ? PROMO_STEPS : GEM_STEPS;
  const isSpecialPage = location.pathname === '/' || location.pathname === '/admin' || location.pathname === '/archive';

  React.useEffect(() => {
    // Auto-save the current project to history every 5 seconds
    const interval = setInterval(() => {
      useProjectStore.getState().autoSaveProject();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // If on lobby, don't show sidebar
  if (location.pathname === '/') {
    return (
      <>
        <TechBackground />
        <Outlet />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-transparent text-neutral-100 overflow-hidden font-sans relative">
      <TechBackground />
      
      {/* Sidebar - Only show if not special page */}
      {!isSpecialPage && (
        <div className={clsx(
          "bg-neutral-950/80 backdrop-blur-xl border-r border-neutral-800/50 flex flex-col z-10 transition-all duration-300",
          isSidebarOpen ? "w-80" : "w-20"
        )}>
          <div className="p-6 border-b border-neutral-800/50 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              {isSidebarOpen ? (
                <div className="cursor-pointer" onClick={() => navigate('/')}>
                  <h1 className="text-xl font-bold text-white tracking-tight">GEM Animation</h1>
                  <p className="text-xs text-neutral-500 mt-1">AI 動畫工作流整合平台</p>
                  <p className="text-sm font-medium text-indigo-400 mt-1">
                    {workflowType === 'gem' ? '故事動畫生成流' : '產品廣告生成流'}
                  </p>
                </div>
              ) : (
                <div className="cursor-pointer" onClick={() => navigate('/')}>
                  <h1 className="text-xl font-bold text-white">G</h1>
                </div>
              )}
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-neutral-400 hover:text-white">
                {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {currentSteps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.includes(step.id);
              const isFuture = !isActive && !isCompleted;

              return (
                <div
                  key={step.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-neutral-800/50',
                    isActive ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)] animate-pulse' : '',
                    isCompleted ? 'text-neutral-300' : '',
                    isFuture ? 'text-neutral-500' : ''
                  )}
                  onClick={() => {
                    navigate(step.path);
                  }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  ) : isActive ? (
                    <Circle className="w-5 h-5 fill-orange-500 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                  {isSidebarOpen && (
                    <span className={clsx('text-sm font-medium', isActive && 'font-semibold')}>
                      {index + 1}. {step.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent z-10 relative">
        <Outlet />
      </div>
    </div>
  );
}
