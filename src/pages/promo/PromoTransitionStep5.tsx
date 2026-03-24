import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { generatePromoVideo } from '../../services/geminiService';
import { ArrowRight, ArrowLeft, Layers, RefreshCw, CheckCircle2, Loader2, Play, Plus, Video, Download, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { downloadAsset } from '../../utils/download';

export default function PromoTransitionStep5() {
  const navigate = useNavigate();
  const { promoScriptData, promoImages, promoVideos, promoTransitions, setPromoTransition, markStepCompleted, setCurrentStep } = useProjectStore();
  
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateTransition = async (transitionIndex: number, transitionPrompt: string) => {
    setGenerating(prev => ({ ...prev, [transitionIndex]: true }));
    
    try {
      // Use end frame of previous scene and start frame of next scene
      const prevSceneNum = promoScriptData!.storyboard[transitionIndex].scene_number;
      const nextSceneNum = promoScriptData!.storyboard[transitionIndex + 1].scene_number;
      
      const videoUrl = await generatePromoVideo({
        prompt: transitionPrompt,
        startFrameDataUrl: promoImages[prevSceneNum]?.end,
        endFrameDataUrl: promoImages[nextSceneNum]?.start,
        aspectRatio: '9:16',
      });

      setPromoTransition(transitionIndex, videoUrl);
      setConfirmed(prev => ({ ...prev, [transitionIndex]: false }));
    } catch (error: any) {
      console.error(`Failed to generate transition ${transitionIndex}:`, error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('模型目前處於高負載狀態，請稍後再試。');
      } else {
        setErrorMsg(`生成轉場 ${transitionIndex + 1} 失敗，請稍後再試。`);
      }
    } finally {
      setGenerating(prev => ({ ...prev, [transitionIndex]: false }));
    }
  };

  const toggleConfirm = (transitionIndex: number) => {
    setConfirmed(prev => ({ ...prev, [transitionIndex]: !prev[transitionIndex] }));
  };

  const handleNext = () => {
    markStepCompleted(4);
    setCurrentStep(5); // Music Step
    navigate('/step-music');
  };

  const handleBack = () => {
    navigate('/step4a');
  };

  if (!promoScriptData) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        請先完成前面的步驟
      </div>
    );
  }

  // Calculate how many transitions we need (N scenes -> N-1 transitions)
  const numTransitions = promoScriptData.storyboard.length - 1;
  
  // If there's only 1 scene, no transitions needed
  const allConfirmed = numTransitions === 0 || Array.from({ length: numTransitions }).every((_, i) => confirmed[i]);

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">4. AI 轉場縫合生成</h2>
            <p className="text-sm text-orange-400/80 font-mono">PROMO.STITCH // The Transition Stitcher</p>
          </div>
        </div>
        <button
          onClick={handleNext}
          disabled={!allConfirmed}
          className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          完成縫合並前往配音
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {errorMsg && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center justify-between w-full max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p>{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-300">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 text-orange-400 mb-4 w-full max-w-4xl mx-auto">
          <Layers className="w-5 h-5" />
          <h3 className="font-semibold">片段時間軸</h3>
        </div>

        {numTransitions === 0 ? (
          <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-400">
            只有一個分鏡，無需生成轉場。請直接點擊右上角前往下一步。
          </div>
        ) : (
          <div className="space-y-12">
            {Array.from({ length: numTransitions }).map((_, idx) => {
              const prevScene = promoScriptData.storyboard[idx];
              const nextScene = promoScriptData.storyboard[idx + 1];
              const transitionPrompt = prevScene.nano_banana_pro_prompts.end_frame || 'smooth transition';

              return (
                <div key={idx} className="relative flex flex-col items-center">
                  {/* Timeline connecting line */}
                  {idx > 0 && <div className="absolute -top-12 w-1 h-12 bg-neutral-800" />}
                  
                  <div className="w-full max-w-4xl bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 relative">
                    <div className="flex items-center justify-between mb-6">
                      <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-md text-sm font-mono font-bold border border-orange-500/30">
                        轉場節點 {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadAsset(promoTransitions[idx], `transition_${idx + 1}.mp4`)}
                          disabled={!promoTransitions[idx]}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-md text-neutral-300 transition-colors flex items-center gap-2 text-sm"
                          title="下載轉場影片"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateTransition(idx, transitionPrompt)}
                          disabled={generating[idx] || confirmed[idx]}
                          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 rounded-md text-neutral-300 transition-colors flex items-center gap-2 text-sm"
                        >
                          <RefreshCw className={clsx("w-4 h-4", generating[idx] && "animate-spin")} />
                          {generating[idx] ? '生成中...' : '生成轉場'}
                        </button>
                        <button
                          onClick={() => toggleConfirm(idx)}
                          disabled={!promoTransitions[idx]}
                          className={clsx(
                            "px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm font-medium",
                            confirmed[idx] 
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
                      {/* Previous Scene Video */}
                      <div className="w-40 shrink-0 space-y-2">
                        <div className="text-xs text-neutral-500 font-mono text-center">場景 {prevScene.scene_number}</div>
                        <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden" style={{ aspectRatio: '9 / 16' }}>
                          {promoVideos[prevScene.scene_number] ? (
                            <video src={promoVideos[prevScene.scene_number]} className="w-full h-full object-cover" muted loop />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <Video className="w-8 h-8 opacity-50" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Transition Node */}
                      <div className="flex-1 w-full max-w-sm space-y-4 flex flex-col items-center">
                        <div className="w-full space-y-2">
                          <div className="text-xs text-neutral-500 font-mono text-center">轉場提示詞</div>
                          <textarea
                            defaultValue={transitionPrompt}
                            className="w-full bg-orange-950/30 border border-orange-900/50 rounded-lg px-3 py-2 text-orange-200 text-sm focus:outline-none focus:border-orange-500/50 h-20 resize-none text-center"
                            readOnly
                          />
                        </div>

                        <div className="w-40 bg-neutral-950 rounded-xl border-2 border-dashed border-orange-500/50 overflow-hidden relative flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.1)]" style={{ aspectRatio: '9 / 16' }}>
                          {promoTransitions[idx] ? (
                            <video 
                              src={promoTransitions[idx]} 
                              className="w-full h-full object-cover"
                              controls
                              autoPlay
                              loop
                              muted
                              crossOrigin="anonymous"
                            />
                          ) : generating[idx] ? (
                            <div className="flex flex-col items-center gap-2 text-orange-500">
                              <Loader2 className="w-8 h-8 animate-spin" />
                              <span className="text-xs font-mono animate-pulse">縫合中...</span>
                            </div>
                          ) : (
                            <div className="text-orange-500/50 flex flex-col items-center gap-1">
                              <Plus className="w-8 h-8" />
                              <span className="text-xs font-mono">轉場</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Scene Video */}
                      <div className="w-40 shrink-0 space-y-2">
                        <div className="text-xs text-neutral-500 font-mono text-center">場景 {nextScene.scene_number}</div>
                        <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden" style={{ aspectRatio: '9 / 16' }}>
                          {promoVideos[nextScene.scene_number] ? (
                            <video src={promoVideos[nextScene.scene_number]} className="w-full h-full object-cover" muted loop />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-600">
                              <Video className="w-8 h-8 opacity-50" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chat Interface for Transition */}
                  <div className="mt-2 bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 space-y-2 w-full max-w-4xl">
                    <input
                      type="text"
                      placeholder={`針對轉場 ${idx + 1} 進行調整...`}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  
                  {/* Timeline connecting line to next node */}
                  {idx < numTransitions - 1 && <div className="absolute -bottom-12 w-1 h-12 bg-neutral-800" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
