import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { adjustPromoPrompt, generatePromoVideo } from '../../services/geminiService';
import { ArrowRight, ArrowLeft, Video, RefreshCw, CheckCircle2, Loader2, Play, Download, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { downloadAsset } from '../../utils/download';

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
  } = useProjectStore();
  
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateVideo = async (sceneNumber: number, videoPrompt: string) => {
    setGenerating(prev => ({ ...prev, [sceneNumber]: true }));
    setProgress(prev => ({ ...prev, [sceneNumber]: 0 }));
    
    try {
      const startDataUrl = promoImages[sceneNumber]?.start;
      const endDataUrl = promoImages[sceneNumber]?.end;
      const videoUrl = await generatePromoVideo({
        prompt: videoPrompt,
        startFrameDataUrl: startDataUrl,
        endFrameDataUrl: endDataUrl,
        aspectRatio: '9:16',
        onProgress: (value) => setProgress(prev => ({ ...prev, [sceneNumber]: value })),
      });

      setPromoVideo(sceneNumber, videoUrl);
    } catch (error: any) {
      console.error(`Failed to generate video for scene ${sceneNumber}:`, error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('模型目前處於高負載狀態，請稍後再試。');
      } else {
        setErrorMsg(`生成場景 ${sceneNumber} 影片失敗，請稍後再試。`);
      }
    } finally {
      setGenerating(prev => ({ ...prev, [sceneNumber]: false }));
      setTimeout(() => {
        setProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[sceneNumber];
          return newProgress;
        });
      }, 2000);
    }
  };

  const handlePromptAdjust = async (sceneNumber: number, userInput: string, currentPrompts: any) => {
    if (!userInput.trim()) return;
    
    setAdjusting(prev => ({ ...prev, [sceneNumber]: true }));
    try {
      const data = await adjustPromoPrompt(userInput, currentPrompts);
      
      updatePromoScenePrompts(sceneNumber, data);
    } catch (error: any) {
      console.error('Adjust prompt error:', error);
      setErrorMsg('調整提示詞失敗，請稍後再試。');
    } finally {
      setAdjusting(prev => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const toggleConfirm = (sceneNumber: number) => {
    setPromoVideoConfirmed(sceneNumber, !promoVideoConfirmed[sceneNumber]);
  };

  const handleNext = () => {
    markStepCompleted(3);
    setCurrentStep(4);
    navigate('/step5a');
  };

  const handleBack = () => {
    navigate('/step3a');
  };

  const allConfirmed = promoScriptData?.storyboard.every(scene => promoVideoConfirmed[scene.scene_number]);

  if (!promoScriptData) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        請先完成前面的步驟
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">3. 動態插幀與影片生成</h2>
            <p className="text-sm text-orange-400/80 font-mono">PROMO.VIDEO // 生成獨立短影片</p>
          </div>
        </div>
        <button
          onClick={handleNext}
          disabled={!allConfirmed}
          className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          下一步
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          
          {errorMsg && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p>{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-orange-400 mb-4">
          <Video className="w-5 h-5" />
          <h3 className="font-semibold">動態插幀影片生成</h3>
        </div>

        {promoScriptData.storyboard.map((scene) => (
          <div key={scene.scene_number} className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-md text-sm font-mono font-bold border border-orange-500/30">
                場景 {scene.scene_number}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadAsset(promoVideos[scene.scene_number], `scene_${scene.scene_number}_video.mp4`)}
                  disabled={!promoVideos[scene.scene_number]}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-md text-neutral-300 transition-colors flex items-center gap-2 text-sm"
                  title="下載影片"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    generateVideo(
                      scene.scene_number,
                      scene.continuity_prompt?.en || scene.nano_banana_pro_prompts.start_frame,
                    )
                  }
                  disabled={generating[scene.scene_number] || promoVideoConfirmed[scene.scene_number]}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-md text-neutral-300 transition-colors flex items-center gap-2 text-sm"
                >
                  <RefreshCw className={clsx("w-4 h-4", generating[scene.scene_number] && "animate-spin")} />
                  {generating[scene.scene_number] ? '生成中...' : '生成影片'}
                </button>
                <button
                  onClick={() => toggleConfirm(scene.scene_number)}
                  disabled={!promoVideos[scene.scene_number]}
                  className={clsx(
                    "px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                    promoVideoConfirmed[scene.scene_number] 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400 disabled:opacity-50"
                  )}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  確定
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 items-center justify-center">
              {/* Start Frame */}
              <div className="w-40 shrink-0 space-y-2">
                <div className="text-xs text-neutral-500 font-mono text-center">首幀圖</div>
                <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden" style={{ aspectRatio: '9 / 16' }}>
                  {promoImages[scene.scene_number]?.start && (
                    <img src={promoImages[scene.scene_number].start} alt="Start" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>

              {/* Motion Prompt & Video */}
              <div className="flex-1 w-full max-w-sm space-y-4 flex flex-col items-center">
                <div className="w-full space-y-2">
                  <div className="text-xs text-neutral-500 font-mono text-center">影片生成提示詞</div>
                  <div className="w-full bg-indigo-950/30 border border-indigo-900/50 rounded-lg px-3 py-2 text-indigo-200 text-sm h-24 overflow-y-auto text-center space-y-2">
                    <p className="font-mono">{scene.continuity_prompt?.en || scene.nano_banana_pro_prompts.start_frame}</p>
                    {(scene.continuity_prompt?.zh || scene.nano_banana_pro_prompts.start_frame_zh) && (
                      <p className="text-xs text-indigo-400/80 font-sans border-t border-indigo-900/50 pt-2">
                        {scene.continuity_prompt?.zh || scene.nano_banana_pro_prompts.start_frame_zh}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-40 bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden relative flex items-center justify-center" style={{ aspectRatio: '9 / 16' }}>
                  {promoVideos[scene.scene_number] ? (
                    <video 
                      src={promoVideos[scene.scene_number]} 
                      className="w-full h-full object-cover"
                      controls
                      autoPlay
                      loop
                      muted
                      crossOrigin="anonymous"
                    />
                  ) : generating[scene.scene_number] ? (
                    <div className="flex flex-col items-center gap-3 text-orange-500 w-full px-4">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs font-mono animate-pulse">影片生成中... ({progress[scene.scene_number] || 0}%)</span>
                      <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-500 ease-out"
                          style={{ width: `${progress[scene.scene_number] || 0}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-neutral-600 flex flex-col items-center gap-2">
                      <Play className="w-8 h-8 opacity-50" />
                      <span className="text-xs">點擊上方按鈕生成影片</span>
                    </div>
                  )}
                </div>
              </div>

              {/* End Frame */}
              <div className="w-40 shrink-0 space-y-2">
                <div className="text-xs text-neutral-500 font-mono text-center">尾幀圖</div>
                <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden" style={{ aspectRatio: '9 / 16' }}>
                  {promoImages[scene.scene_number]?.end && (
                    <img src={promoImages[scene.scene_number].end} alt="End" className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-2 bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 space-y-2 w-full max-w-4xl mx-auto relative">
              <input
                type="text"
                placeholder={`針對場景 ${scene.scene_number} 進行調整... (按 Enter 送出)`}
                disabled={adjusting[scene.scene_number]}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePromptAdjust(scene.scene_number, e.currentTarget.value, scene.nano_banana_pro_prompts);
                    e.currentTarget.value = '';
                  }
                }}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50 disabled:opacity-50"
              />
              {adjusting[scene.scene_number] && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}
