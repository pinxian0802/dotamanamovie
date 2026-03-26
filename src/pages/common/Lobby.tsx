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
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleStart = (type: 'gem' | 'promo') => {
    setIsTransitioning(true);
    resetProject();
    setWorkflowType(type);
    addProjectToHistory();
    setTimeout(() => {
      navigate(type === 'gem' ? '/step1' : '/step2a');
    }, 1500);
  };

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

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button
            onClick={() => handleStart('gem')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-bold transition-all hover:scale-105 hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:shadow-[0_0_50px_rgba(79,70,229,0.8)]"
          >
            <span>
              {LOBBY_COPY.gemButton}
              <br />
              <span className="text-sm font-normal opacity-80">({LOBBY_COPY.gemCaption})</span>
            </span>
            <Play className="w-6 h-6 fill-white group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleStart('promo')}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-full text-lg font-bold transition-all hover:scale-105 hover:bg-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.8)]"
          >
            <span>
              {LOBBY_COPY.promoButton}
              <br />
              <span className="text-sm font-normal opacity-80">({LOBBY_COPY.promoCaption})</span>
            </span>
            <Play className="w-6 h-6 fill-white group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
