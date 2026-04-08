import React, { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { clsx } from 'clsx';
import { CheckCircle2, Circle, Menu, ChevronLeft } from 'lucide-react';
import TechBackground from './TechBackground';
import { APP_NAME, APP_FULL_NAME, GEM_STEPS, PROMO_STEPS, PROMO_STORY_STEPS } from '../config/workflowCopy';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const currentStep = useProjectStore((state) => state.currentStep);
  const completedSteps = useProjectStore((state) => state.completedSteps);
  const workflowType = useProjectStore((state) => state.workflowType);
  const workflowVariant = useProjectStore((state) => state.workflowVariant);

  const currentSteps = useMemo(() => {
    if (workflowVariant === 'promo-story') return PROMO_STORY_STEPS;
    if (workflowType === 'promo') return PROMO_STEPS;
    return GEM_STEPS;
  }, [workflowType, workflowVariant]);

  const workflowMeta = useMemo(() => {
    if (workflowVariant === 'promo-story') {
      return {
        label: 'PROMO STORY',
        accent: 'text-emerald-400',
        activeClass:
          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        iconClass: 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      };
    }

    if (workflowType === 'promo') {
      return {
        label: 'PROMO 產品廣告流',
        accent: 'text-orange-400',
        activeClass:
          'bg-orange-500/20 text-orange-300 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]',
        iconClass: 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]',
      };
    }

    return {
      label: 'GEM 故事動畫流',
      accent: 'text-indigo-400',
      activeClass:
        'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]',
      iconClass: 'text-indigo-500 drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]',
    };
  }, [workflowType, workflowVariant]);

  const isSpecialPage =
    location.pathname === '/' ||
    location.pathname === '/admin' ||
    location.pathname === '/archive' ||
    location.pathname === '/api-key' ||
    location.pathname === '/promo-story/step1';

  React.useEffect(() => {
    const interval = setInterval(() => {
      useProjectStore.getState().autoSaveProject();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isSpecialPage) {
    return (
      <>
        <TechBackground />
        <div className="relative z-10 min-h-screen">
          <Outlet />
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-transparent text-neutral-100 overflow-hidden font-sans relative">
      <TechBackground />

      <div
        className={clsx(
          'bg-neutral-950/80 backdrop-blur-xl border-r border-neutral-800/50 flex flex-col z-10 transition-all duration-300',
          isSidebarOpen ? 'w-80' : 'w-20'
        )}
      >
        <div className="p-6 border-b border-neutral-800/50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <div className="cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="text-xl font-bold text-white tracking-tight">{APP_NAME}</h1>
                <p className="text-xs text-neutral-500 mt-1">{APP_FULL_NAME}</p>
                <p className={clsx('text-sm font-medium mt-1', workflowMeta.accent)}>{workflowMeta.label}</p>
              </div>
            ) : (
              <div className="cursor-pointer" onClick={() => navigate('/')}>
                <h1 className="text-xl font-bold text-white">{APP_NAME[0]}</h1>
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
                  isActive && workflowMeta.activeClass,
                  isCompleted && 'text-neutral-300',
                  isFuture && 'text-neutral-500'
                )}
                onClick={() => navigate(step.path)}
              >
                {isCompleted ? (
                  <CheckCircle2 className={clsx('w-5 h-5', workflowMeta.iconClass)} />
                ) : isActive ? (
                  <Circle className={clsx('w-5 h-5 fill-current', workflowMeta.iconClass)} />
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

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent z-10 relative">
        <Outlet />
      </div>
    </div>
  );
}
