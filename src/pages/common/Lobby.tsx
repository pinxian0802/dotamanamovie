import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { Sparkles, Play, BarChart3, Archive, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_NAME, LOBBY_COPY } from '../../config/workflowCopy';

export default function Lobby() {
  const navigate = useNavigate();
  const resetProject = useProjectStore((state) => state.resetProject);
  const setWorkflowType = useProjectStore((state) => state.setWorkflowType);
  const addProjectToHistory = useProjectStore((state) => state.addProjectToHistory);
  const setCurrentStep = useProjectStore((state) => state.setCurrentStep);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = (type: 'gem' | 'promo', route: string, step: number) => {
    setIsTransitioning(true);
    resetProject();
    setWorkflowType(type);
    setCurrentStep(step);
    addProjectToHistory();
    setTimeout(() => {
      navigate(route);
    }, 1500);
  };

  const workflowCards = [
    {
      title: 'INITIATE GEM WORKFLOW',
      subtitle: '啟動故事動畫生成流',
      description: '從故事發想、角色設定、場景生成到動態影片與音畫整合，走完整的原創動畫工作流。',
      icon: <Sparkles className="w-6 h-6 text-indigo-300" />,
      badge: null,
      route: '/step1',
      workflowType: 'gem' as const,
      step: 1,
      cardClass:
        'border-indigo-500/25 bg-indigo-500/10 shadow-[0_0_30px_rgba(79,70,229,0.28)] hover:shadow-[0_0_50px_rgba(79,70,229,0.45)]',
      titleClass: 'text-indigo-100',
      accentClass: 'text-indigo-300',
    },
    {
      title: 'INITIATE PROMO WORKFLOW',
      subtitle: '啟動產品廣告生成流',
      description: '讓 AI 先做產品腳本、分鏡、首尾幀與動態提示詞，再一路進到影片與轉場製作。',
      icon: <Play className="w-6 h-6 fill-orange-200 text-orange-300" />,
      badge: null,
      route: '/step2a',
      workflowType: 'promo' as const,
      step: 1,
      cardClass:
        'border-orange-500/25 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.28)] hover:shadow-[0_0_50px_rgba(249,115,22,0.45)]',
      titleClass: 'text-orange-100',
      accentClass: 'text-orange-300',
    },
    {
      title: 'PROMO STORY',
      subtitle: '商業故事短影音',
      description: '自由撰寫故事腳本，AI 自動拆解分鏡並生成首尾幀提示詞，快速進入影片製作流程。',
      icon: <span className="text-2xl leading-none">📖</span>,
      badge: 'NEW',
      route: '/promo-story/step1',
      workflowType: 'promo' as const,
      step: 1,
      cardClass:
        'border-emerald-500/25 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.22)] hover:shadow-[0_0_50px_rgba(16,185,129,0.38)]',
      titleClass: 'text-emerald-100',
      accentClass: 'text-emerald-300',
    },
  ];

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center relative font-sans z-10">
      <div className="absolute top-6 right-6 z-20 flex gap-4">
        <button
          onClick={() => navigate('/api-key')}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full border border-neutral-700 transition-all backdrop-blur-sm text-sm font-medium"
        >
          <KeyRound className="w-4 h-4" />
          API Key 設定
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full border border-neutral-700 transition-all backdrop-blur-sm text-sm font-medium"
        >
          <BarChart3 className="w-4 h-4" />
          API 用量監控
        </button>
        <button
          onClick={() => navigate('/archive')}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-full border border-neutral-700 transition-all backdrop-blur-sm text-sm font-medium"
        >
          <Archive className="w-4 h-4" />
          專案封存區
        </button>
      </div>

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden pointer-events-none"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 90 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {Array.from({ length: 25 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.1, z: -2000 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.1, 5], z: [-2000, 1000] }}
                  transition={{ duration: 1.2, ease: 'easeIn', delay: i * 0.05 }}
                  className="absolute w-[30vw] h-[30vw] border-[2px] border-white"
                  style={{
                    boxShadow: '0 0 40px rgba(255,255,255,0.8), inset 0 0 40px rgba(255,255,255,0.8)',
                  }}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.1, ease: 'easeIn' }}
              className="absolute inset-0 bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="z-10 text-center max-w-3xl px-6"
      >
        <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-8 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <Sparkles className="w-8 h-8 text-indigo-400" />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
          {APP_NAME}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-indigo-400 whitespace-nowrap">
            {LOBBY_COPY.subtitle}
          </span>
        </h1>

        <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          {LOBBY_COPY.description}
        </p>

        <div className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
          {workflowCards.map((card) => (
            <button
              key={card.title}
              onClick={() => handleStart(card.workflowType, card.route, card.step)}
              className={`group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[28px] border p-6 text-left transition-all hover:-translate-y-1 ${card.cardClass}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur-sm">
                  {card.icon}
                </div>
                {card.badge && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-white">
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <div className={`text-2xl font-bold tracking-tight ${card.titleClass}`}>{card.title}</div>
                <div className={`text-sm font-medium ${card.accentClass}`}>{card.subtitle}</div>
                <p className="text-sm leading-relaxed text-neutral-300">{card.description}</p>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-white/90">
                進入工作流
                <Play className="h-4 w-4 fill-white/90 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
