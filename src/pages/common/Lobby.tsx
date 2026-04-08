import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore, type WorkflowVariant } from '../../store/useProjectStore';
import { Sparkles, Play, BarChart3, Archive, KeyRound, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_NAME, LOBBY_COPY } from '../../config/workflowCopy';

type WorkflowCard = {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  badge: string | null;
  route: string;
  workflowType: 'gem' | 'promo';
  workflowVariant: WorkflowVariant;
  step: number;
  cardClass: string;
  titleClass: string;
  accentClass: string;
};

export default function Lobby() {
  const navigate = useNavigate();
  const resetProject = useProjectStore((state) => state.resetProject);
  const setWorkflowType = useProjectStore((state) => state.setWorkflowType);
  const setWorkflowVariant = useProjectStore((state) => state.setWorkflowVariant);
  const setCurrentStep = useProjectStore((state) => state.setCurrentStep);
  const setName = useProjectStore((state) => state.setName);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [pendingCard, setPendingCard] = useState<WorkflowCard | null>(null);

  const workflowCards = useMemo<WorkflowCard[]>(
    () => [
      {
        title: 'INITIATE GEM WORKFLOW',
        subtitle: '原創故事動畫流程',
        description: '從故事發想、角色、場景到合成與影片生成，適合需要完整敘事與角色世界觀的動畫流程。',
        icon: <Sparkles className="w-6 h-6 text-indigo-300" />,
        badge: null,
        route: '/step1',
        workflowType: 'gem',
        workflowVariant: 'gem',
        step: 1,
        cardClass:
          'border-indigo-500/25 bg-indigo-500/10 shadow-[0_0_30px_rgba(79,70,229,0.28)] hover:shadow-[0_0_50px_rgba(79,70,229,0.45)]',
        titleClass: 'text-indigo-100',
        accentClass: 'text-indigo-300',
      },
      {
        title: 'INITIATE PROMO WORKFLOW',
        subtitle: '產品廣告短影音流程',
        description: '專注在腳本、首尾影格、動態插幀與轉場縫合，適合高停留率的產品廣告內容。',
        icon: <Play className="w-6 h-6 fill-orange-200 text-orange-300" />,
        badge: null,
        route: '/step2a',
        workflowType: 'promo',
        workflowVariant: 'promo',
        step: 1,
        cardClass:
          'border-orange-500/25 bg-orange-500/10 shadow-[0_0_30px_rgba(249,115,22,0.28)] hover:shadow-[0_0_50px_rgba(249,115,22,0.45)]',
        titleClass: 'text-orange-100',
        accentClass: 'text-orange-300',
      },
      {
        title: 'PROMO STORY',
        subtitle: '故事型產品短片流程',
        description: '先整理故事腳本與分鏡，再往角色、影格與影片生成推進，適合需要敘事感的品牌短片。',
        icon: <span className="text-2xl leading-none">PS</span>,
        badge: 'NEW',
        route: '/promo-story/step1',
        workflowType: 'promo',
        workflowVariant: 'promo-story',
        step: 1,
        cardClass:
          'border-emerald-500/25 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.22)] hover:shadow-[0_0_50px_rgba(16,185,129,0.38)]',
        titleClass: 'text-emerald-100',
        accentClass: 'text-emerald-300',
      },
    ],
    []
  );

  const beginWorkflow = (card: WorkflowCard) => {
    setIsTransitioning(true);
    resetProject();
    setName(projectName.trim());
    setWorkflowType(card.workflowType);
    setWorkflowVariant(card.workflowVariant);
    setCurrentStep(card.step);
    setIsNamingOpen(false);
    setTimeout(() => {
      navigate(card.route);
      setIsTransitioning(false);
    }, 1500);
  };

  const handleCardClick = (card: WorkflowCard) => {
    if (isTransitioning) return;
    setPendingCard(card);
    setProjectName('');
    setIsNamingOpen(true);
  };

  const handleConfirmNaming = () => {
    if (!pendingCard || !projectName.trim()) return;
    beginWorkflow(pendingCard);
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

      <AnimatePresence>
        {isNamingOpen && pendingCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950/95 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.24em] ${pendingCard.accentClass}`}>
                    {pendingCard.title}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-white">先命名這個專案</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                    請先輸入專案名稱，確認後才會正式進入流程第一步。
                  </p>
                </div>
                <button
                  onClick={() => setIsNamingOpen(false)}
                  className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-900 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-neutral-300">專案名稱</label>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleConfirmNaming();
                  }}
                  autoFocus
                  placeholder="例如：春季新品短片企劃"
                  className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsNamingOpen(false)}
                  className="rounded-full border border-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:bg-neutral-900 hover:text-white"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmNaming}
                  disabled={!projectName.trim()}
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  確認並進入
                </button>
              </div>
            </motion.div>
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
              onClick={() => handleCardClick(card)}
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
                建立專案並進入
                <Play className="h-4 w-4 fill-white/90 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
