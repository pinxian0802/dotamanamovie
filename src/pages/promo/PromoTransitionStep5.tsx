import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FolderOpen,
  Layers,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Video,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../store/useProjectStore';
import { generatePromoVideo } from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';
import AssetHistoryModal from '../../components/AssetHistoryModal';
import MediaPreviewModal from '../../components/MediaPreviewModal';

const getHistoryKey = (transitionIndex: number) => `promo-transition-${transitionIndex}`;

export default function PromoTransitionStep5() {
  const navigate = useNavigate();
  const {
    promoScriptData,
    promoImages,
    promoVideos,
    promoTransitions,
    promoTransitionConfirmed,
    setPromoTransition,
    setPromoTransitionConfirmed,
    markStepCompleted,
    setCurrentStep,
    assetHistory,
    pushAssetHistory,
  } = useProjectStore();

  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ src: string; title: string } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; key: string; title: string; transitionIndex: number } | null>(null);

  const generateTransition = async (transitionIndex: number, transitionPrompt: string) => {
    if (!promoScriptData) return;
    setGenerating((prev) => ({ ...prev, [transitionIndex]: true }));
    setErrorMsg(null);

    try {
      const prevSceneNum = promoScriptData.storyboard[transitionIndex].scene_number;
      const nextSceneNum = promoScriptData.storyboard[transitionIndex + 1].scene_number;

      const videoUrl = await generatePromoVideo({
        prompt: transitionPrompt,
        startFrameDataUrl: promoImages[prevSceneNum]?.end,
        endFrameDataUrl: promoImages[nextSceneNum]?.start,
        aspectRatio: '9:16',
      });

      setPromoTransition(transitionIndex, videoUrl);
      pushAssetHistory(getHistoryKey(transitionIndex), {
        kind: 'video',
        title: `Transition ${transitionIndex + 1}`,
        value: videoUrl,
      });
    } catch (error: any) {
      console.error(`Failed to generate transition ${transitionIndex}:`, error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額不足，請稍後再試或更換 API Key。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('轉場服務暫時不可用，請稍後重試。');
      } else {
        setErrorMsg(`轉場 ${transitionIndex + 1} 生成失敗，請稍後再試。`);
      }
    } finally {
      setGenerating((prev) => ({ ...prev, [transitionIndex]: false }));
    }
  };

  const toggleConfirm = (transitionIndex: number) => {
    setPromoTransitionConfirmed(transitionIndex, !promoTransitionConfirmed[transitionIndex]);
  };

  const openHistory = (transitionIndex: number) => {
    setHistoryModal({
      open: true,
      key: getHistoryKey(transitionIndex),
      title: `Transition ${transitionIndex + 1} History`,
      transitionIndex,
    });
  };

  const handleRestoreHistory = (entry: { value: string }, value?: string) => {
    if (!historyModal) return;
    const restoredValue = value || entry.value;
    if (!restoredValue) return;
    setPromoTransition(historyModal.transitionIndex, restoredValue);
  };

  const handleNext = () => {
    markStepCompleted(4);
    setCurrentStep(5);
    navigate('/step-music');
  };

  const handleBack = () => {
    navigate('/step4a');
  };

  if (!promoScriptData) {
    return <div className="flex flex-1 items-center justify-center text-neutral-400">尚未找到 PROMO 腳本資料。</div>;
  }

  const numTransitions = promoScriptData.storyboard.length - 1;
  const allConfirmed =
    numTransitions === 0 || Array.from({ length: numTransitions }).every((_, index) => promoTransitionConfirmed[index]);

  return (
    <div className="relative z-10 flex h-full flex-col overflow-hidden bg-transparent">
      <div className="shrink-0 border-b border-neutral-800/50 bg-neutral-950/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-white">4. 轉場縫合</h2>
              <p className="text-sm font-mono text-orange-400/80">PROMO.STITCH // transition generation and review</p>
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={!allConfirmed}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            進入音樂整合
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto p-6">
        {errorMsg && (
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between rounded-xl border border-red-500/50 bg-red-900/30 px-4 py-3 text-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 transition-colors hover:text-red-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mx-auto mb-4 flex w-full max-w-4xl items-center gap-2 text-orange-400">
          <Layers className="h-5 w-5" />
          <h3 className="font-semibold">場景之間的轉場</h3>
        </div>

        {numTransitions === 0 ? (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-8 text-center text-neutral-400">
            只有一個場景時不需要額外生成轉場，直接進入下一步即可。
          </div>
        ) : (
          <div className="space-y-12">
            {Array.from({ length: numTransitions }).map((_, idx) => {
              const prevScene = promoScriptData.storyboard[idx];
              const nextScene = promoScriptData.storyboard[idx + 1];
              const transitionPrompt =
                prevScene.transition?.prompt_en ||
                prevScene.transition?.logic ||
                prevScene.nano_banana_pro_prompts.end_frame ||
                'smooth transition';
              const transitionVideo = promoTransitions[idx];
              const isGenerating = generating[idx];
              const isConfirmed = promoTransitionConfirmed[idx];
              const hasHistory = Boolean(assetHistory[getHistoryKey(idx)]?.length);

              return (
                <div key={idx} className="relative flex flex-col items-center">
                  {idx > 0 && <div className="absolute -top-12 h-12 w-1 bg-neutral-800" />}

                  <div className="relative w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="rounded-md border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-sm font-bold text-orange-400">
                        轉場 {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadAsset(transitionVideo, `transition_${idx + 1}.mp4`)}
                          disabled={!transitionVideo}
                          className="flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                          title="下載轉場"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openHistory(idx)}
                          disabled={!hasHistory}
                          className="flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                          title="開啟歷史版本"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => generateTransition(idx, transitionPrompt)}
                          disabled={isGenerating || isConfirmed}
                          className="flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                        >
                          <RefreshCw className={clsx('h-4 w-4', isGenerating && 'animate-spin')} />
                          {isGenerating ? '生成中...' : '重新生成'}
                        </button>
                        <button
                          onClick={() => toggleConfirm(idx)}
                          disabled={!transitionVideo}
                          className={clsx(
                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            isConfirmed
                              ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                              : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-50',
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          確認
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-6 lg:flex-row">
                      <div className="w-40 shrink-0 space-y-2">
                        <div className="text-center text-xs font-mono text-neutral-500">Scene {prevScene.scene_number}</div>
                        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950" style={{ aspectRatio: '9 / 16' }}>
                          {promoVideos[prevScene.scene_number] ? (
                            <button
                              onClick={() =>
                                setPreviewVideo({
                                  src: promoVideos[prevScene.scene_number],
                                  title: `Scene ${prevScene.scene_number} Video`,
                                })
                              }
                              className="h-full w-full"
                            >
                              <video src={promoVideos[prevScene.scene_number]} className="h-full w-full object-cover" muted loop />
                            </button>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-600">
                              <Video className="h-8 w-8 opacity-50" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex w-full max-w-sm flex-1 flex-col items-center space-y-4">
                        <div className="w-full space-y-2">
                          <div className="text-center text-xs font-mono text-neutral-500">Transition Prompt</div>
                          <textarea
                            value={transitionPrompt}
                            readOnly
                            className="h-24 w-full resize-none rounded-lg border border-orange-900/50 bg-orange-950/30 px-3 py-2 text-center text-sm text-orange-200 outline-none"
                          />
                        </div>

                        <div
                          className="relative flex w-40 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-orange-500/50 bg-neutral-950 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                          style={{ aspectRatio: '9 / 16' }}
                        >
                          {transitionVideo ? (
                            <button
                              onClick={() =>
                                setPreviewVideo({
                                  src: transitionVideo,
                                  title: `Transition ${idx + 1}`,
                                })
                              }
                              className="h-full w-full"
                            >
                              <video src={transitionVideo} className="h-full w-full object-cover" controls autoPlay loop muted crossOrigin="anonymous" />
                            </button>
                          ) : isGenerating ? (
                            <div className="flex flex-col items-center gap-2 text-orange-500">
                              <Loader2 className="h-8 w-8 animate-spin" />
                              <span className="text-xs font-mono">生成中...</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-orange-500/50">
                              <Plus className="h-8 w-8" />
                              <span className="text-xs font-mono">Transition</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-40 shrink-0 space-y-2">
                        <div className="text-center text-xs font-mono text-neutral-500">Scene {nextScene.scene_number}</div>
                        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950" style={{ aspectRatio: '9 / 16' }}>
                          {promoVideos[nextScene.scene_number] ? (
                            <button
                              onClick={() =>
                                setPreviewVideo({
                                  src: promoVideos[nextScene.scene_number],
                                  title: `Scene ${nextScene.scene_number} Video`,
                                })
                              }
                              className="h-full w-full"
                            >
                              <video src={promoVideos[nextScene.scene_number]} className="h-full w-full object-cover" muted loop />
                            </button>
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-neutral-600">
                              <Play className="h-8 w-8 opacity-50" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {idx < numTransitions - 1 && <div className="absolute -bottom-12 h-12 w-1 bg-neutral-800" />}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AssetHistoryModal
        open={Boolean(historyModal?.open)}
        title={historyModal?.title || 'Transition History'}
        entries={historyModal ? assetHistory[historyModal.key] || [] : []}
        onClose={() => setHistoryModal(null)}
        onRestore={handleRestoreHistory}
      />
      <MediaPreviewModal
        open={Boolean(previewVideo)}
        onClose={() => setPreviewVideo(null)}
        src={previewVideo?.src || null}
        mediaType="video"
        title={previewVideo?.title}
      />
    </div>
  );
}
