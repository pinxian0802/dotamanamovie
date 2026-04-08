import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FolderOpen,
  Loader2,
  Play,
  RefreshCw,
  Video,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../store/useProjectStore';
import { adjustPromoPrompt, generatePromoVideo } from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';
import AssetHistoryModal from '../../components/AssetHistoryModal';
import MediaPreviewModal from '../../components/MediaPreviewModal';

const getHistoryKey = (sceneNumber: number) => `promo-video-${sceneNumber}`;

export default function PromoVideoStep4() {
  const navigate = useNavigate();
  const {
    promoScriptData,
    promoImages,
    promoVideos,
    promoVideoConfirmed,
    setPromoVideo,
    setPromoVideoConfirmed,
    markStepCompleted,
    setCurrentStep,
    updatePromoScenePrompts,
    assetHistory,
    pushAssetHistory,
  } = useProjectStore();

  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ src: string; title: string; mediaType: 'image' | 'video' } | null>(null);
  const [historyModal, setHistoryModal] = useState<{ open: boolean; key: string; title: string; sceneNumber: number } | null>(null);

  const generateVideo = async (sceneNumber: number, videoPrompt: string) => {
    setGenerating((prev) => ({ ...prev, [sceneNumber]: true }));
    setProgress((prev) => ({ ...prev, [sceneNumber]: 0 }));
    setErrorMsg(null);

    try {
      const startDataUrl = promoImages[sceneNumber]?.start;
      const endDataUrl = promoImages[sceneNumber]?.end;
      const videoUrl = await generatePromoVideo({
        prompt: videoPrompt,
        startFrameDataUrl: startDataUrl,
        endFrameDataUrl: endDataUrl,
        aspectRatio: '9:16',
        onProgress: (value) => setProgress((prev) => ({ ...prev, [sceneNumber]: value })),
      });

      setPromoVideo(sceneNumber, videoUrl);
      pushAssetHistory(getHistoryKey(sceneNumber), {
        kind: 'video',
        title: `Scene ${sceneNumber} Video`,
        value: videoUrl,
      });
    } catch (error: any) {
      console.error(`Failed to generate video for scene ${sceneNumber}:`, error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額不足，請稍後再試或更換 API Key。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('影片服務暫時不可用，請稍後重試。');
      } else {
        setErrorMsg(`場景 ${sceneNumber} 影片生成失敗，請稍後再試。`);
      }
    } finally {
      setGenerating((prev) => ({ ...prev, [sceneNumber]: false }));
      setTimeout(() => {
        setProgress((prev) => {
          const next = { ...prev };
          delete next[sceneNumber];
          return next;
        });
      }, 1500);
    }
  };

  const handlePromptAdjust = async (sceneNumber: number, userInput: string, currentPrompts: any) => {
    if (!userInput.trim()) return;

    setAdjusting((prev) => ({ ...prev, [sceneNumber]: true }));
    setErrorMsg(null);
    try {
      const data = await adjustPromoPrompt(userInput, currentPrompts);
      updatePromoScenePrompts(sceneNumber, data);
    } catch (error) {
      console.error('Adjust prompt error:', error);
      setErrorMsg('影片提示詞調整失敗，請稍後再試。');
    } finally {
      setAdjusting((prev) => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const toggleConfirm = (sceneNumber: number) => {
    setPromoVideoConfirmed(sceneNumber, !promoVideoConfirmed[sceneNumber]);
  };

  const openHistory = (sceneNumber: number) => {
    setHistoryModal({
      open: true,
      key: getHistoryKey(sceneNumber),
      title: `Scene ${sceneNumber} Video History`,
      sceneNumber,
    });
  };

  const handleRestoreHistory = (entry: { value: string }, value?: string) => {
    if (!historyModal) return;
    const restoredValue = value || entry.value;
    if (!restoredValue) return;
    setPromoVideo(historyModal.sceneNumber, restoredValue);
  };

  const handleNext = () => {
    markStepCompleted(3);
    setCurrentStep(4);
    navigate('/step5a');
  };

  const handleBack = () => {
    navigate('/step3a');
  };

  const allConfirmed = promoScriptData?.storyboard.every((scene) => promoVideoConfirmed[scene.scene_number]);

  if (!promoScriptData) {
    return <div className="flex flex-1 items-center justify-center text-neutral-400">尚未找到 PROMO 腳本資料。</div>;
  }

  return (
    <div className="relative z-10 flex h-full flex-col overflow-hidden bg-transparent">
      <div className="shrink-0 border-b border-neutral-800/50 bg-neutral-950/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-white">3. 動態插幀</h2>
              <p className="text-sm font-mono text-orange-400/80">PROMO.VIDEO // continuity prompt to video</p>
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={!allConfirmed}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            下一步
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {errorMsg && (
            <div className="flex items-center justify-between rounded-xl border border-red-500/50 bg-red-900/30 px-4 py-3 text-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p>{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 transition-colors hover:text-red-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mb-4 flex items-center gap-2 text-orange-400">
            <Video className="h-5 w-5" />
            <h3 className="font-semibold">場景影片生成</h3>
          </div>

          {promoScriptData.storyboard.map((scene) => {
            const sceneNumber = scene.scene_number;
            const videoUrl = promoVideos[sceneNumber];
            const isGenerating = generating[sceneNumber];
            const isConfirmed = promoVideoConfirmed[sceneNumber];
            const hasHistory = Boolean(assetHistory[getHistoryKey(sceneNumber)]?.length);

            return (
              <div key={sceneNumber} className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="rounded-md border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-sm font-bold text-orange-400">
                    場景 {sceneNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadAsset(videoUrl, `scene_${sceneNumber}_video.mp4`)}
                      disabled={!videoUrl}
                      className="flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                      title="下載影片"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openHistory(sceneNumber)}
                      disabled={!hasHistory}
                      className="flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                      title="開啟歷史版本"
                    >
                      <FolderOpen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => generateVideo(sceneNumber, scene.continuity_prompt?.en || scene.nano_banana_pro_prompts.start_frame)}
                      disabled={isGenerating || isConfirmed}
                      className="flex items-center gap-2 rounded-md bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                    >
                      <RefreshCw className={clsx('h-4 w-4', isGenerating && 'animate-spin')} />
                      {isGenerating ? '生成中...' : '重新生成'}
                    </button>
                    <button
                      onClick={() => toggleConfirm(sceneNumber)}
                      disabled={!videoUrl}
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
                    <div className="text-center text-xs font-mono text-neutral-500">Start</div>
                    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950" style={{ aspectRatio: '9 / 16' }}>
                      {promoImages[sceneNumber]?.start && (
                        <button
                          onClick={() =>
                            setPreviewMedia({
                              src: promoImages[sceneNumber].start,
                              title: `Scene ${sceneNumber} Start Frame`,
                              mediaType: 'image',
                            })
                          }
                          className="h-full w-full"
                        >
                          <img src={promoImages[sceneNumber].start} alt="Start Frame" className="h-full w-full object-cover" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full max-w-sm flex-1 flex-col items-center space-y-4">
                    <div className="w-full space-y-2">
                      <div className="text-center text-xs font-mono text-neutral-500">Motion Prompt</div>
                      <div className="h-24 overflow-y-auto rounded-lg border border-indigo-900/50 bg-indigo-950/30 px-3 py-2 text-center text-sm text-indigo-200">
                        <p className="font-mono">{scene.continuity_prompt?.en || scene.nano_banana_pro_prompts.start_frame}</p>
                        {(scene.continuity_prompt?.zh || scene.nano_banana_pro_prompts.start_frame_zh) && (
                          <p className="mt-2 border-t border-indigo-900/50 pt-2 text-xs text-indigo-400/80">
                            {scene.continuity_prompt?.zh || scene.nano_banana_pro_prompts.start_frame_zh}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="relative flex w-40 items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950" style={{ aspectRatio: '9 / 16' }}>
                      {videoUrl ? (
                        <button
                          onClick={() =>
                            setPreviewMedia({
                              src: videoUrl,
                              title: `Scene ${sceneNumber} Video`,
                              mediaType: 'video',
                            })
                          }
                          className="h-full w-full"
                        >
                          <video src={videoUrl} className="h-full w-full object-cover" controls autoPlay loop muted crossOrigin="anonymous" />
                        </button>
                      ) : isGenerating ? (
                        <div className="flex w-full flex-col items-center gap-3 px-4 text-orange-500">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <span className="text-xs font-mono">生成中... ({progress[sceneNumber] || 0}%)</span>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                            <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${progress[sceneNumber] || 0}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-neutral-600">
                          <Play className="h-8 w-8 opacity-50" />
                          <span className="text-xs">尚未生成影片</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="w-40 shrink-0 space-y-2">
                    <div className="text-center text-xs font-mono text-neutral-500">End</div>
                    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950" style={{ aspectRatio: '9 / 16' }}>
                      {promoImages[sceneNumber]?.end && (
                        <button
                          onClick={() =>
                            setPreviewMedia({
                              src: promoImages[sceneNumber].end,
                              title: `Scene ${sceneNumber} End Frame`,
                              mediaType: 'image',
                            })
                          }
                          className="h-full w-full"
                        >
                          <img src={promoImages[sceneNumber].end} alt="End Frame" className="h-full w-full object-cover" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative mx-auto mt-4 w-full max-w-4xl rounded-lg border border-neutral-800 bg-neutral-950/50 p-4">
                  <input
                    type="text"
                    placeholder={`補充說明場景 ${sceneNumber} 的動態、速度、鏡頭感或音效後按 Enter`}
                    disabled={adjusting[sceneNumber]}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        handlePromptAdjust(sceneNumber, event.currentTarget.value, scene.nano_banana_pro_prompts);
                        event.currentTarget.value = '';
                      }
                    }}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 disabled:opacity-50"
                  />
                  {adjusting[sceneNumber] && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AssetHistoryModal
        open={Boolean(historyModal?.open)}
        title={historyModal?.title || 'Video History'}
        entries={historyModal ? assetHistory[historyModal.key] || [] : []}
        onClose={() => setHistoryModal(null)}
        onRestore={handleRestoreHistory}
      />
      <MediaPreviewModal
        open={Boolean(previewMedia)}
        onClose={() => setPreviewMedia(null)}
        src={previewMedia?.src || null}
        mediaType={previewMedia?.mediaType || 'image'}
        title={previewMedia?.title}
      />
    </div>
  );
}
