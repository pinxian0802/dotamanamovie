import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { adjustPromoScriptData, generatePromoScriptData, type PromoScriptGenerationStage } from '../../services/geminiService';
import { Sparkles, ArrowRight, Loader2, Package, FileText, Paperclip, X, AlertTriangle, MessageSquareText, FolderOpen } from 'lucide-react';
import { DataMatrixLoader } from '../../components/DataMatrixLoader';
import { clsx } from 'clsx';
import AssetHistoryModal from '../../components/AssetHistoryModal';

export default function PromoScriptStep2() {
  const navigate = useNavigate();
  const {
    setPromoScriptData,
    markStepCompleted,
    setCurrentStep,
    promoScriptData,
    promoScriptForm,
    setPromoScriptForm,
    addPromoScriptReferenceFiles,
    removePromoScriptReferenceFile,
    currentProjectId,
    addProjectToHistory,
    assetHistory,
    pushAssetHistory,
  } = useProjectStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<PromoScriptGenerationStage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const historyKey = 'promo-script-step1';

  const generationStageText: Record<PromoScriptGenerationStage, string> = {
    phase1: '階段一：AI 正在整理爆款企劃、Hook 與旁白文案...',
    phase2: '階段二：AI 正在拆解視覺分鏡、景別與運鏡節奏...',
    phase3: '階段三：AI 正在轉譯首尾幀與 Veo 動態提示詞...',
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || !promoScriptData) return;

    const userMessage = { role: 'user' as const, text: chatInput };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setChatInput('');
    setIsGenerating(true);
    setGenerationStage(null);

    try {
      const data = await adjustPromoScriptData(promoScriptData, chatInput);
      setPromoScriptData(data);
      pushAssetHistory(historyKey, {
        kind: 'text',
        title: 'PROMO Script Adjustment',
        value: JSON.stringify(data, null, 2),
      });
      setChatHistory([
        ...newHistory,
        { role: 'model', text: '已依照你的回饋更新腳本與分鏡。你可以繼續追問，或直接進入首尾幀生成。' },
      ]);
    } catch (error) {
      console.error(error);
      setChatHistory([
        ...newHistory,
        { role: 'model', text: '調整失敗，請稍後再試，或直接在欄位中補充更明確的修改方向。' },
      ]);
    } finally {
      setIsGenerating(false);
      setGenerationStage(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        addPromoScriptReferenceFiles([
          {
            mimeType: file.type,
            data: base64String,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    removePromoScriptReferenceFile(index);
  };

  const handleGenerate = async () => {
    const {
      productName,
      productFeatures,
      productContents,
      productOrigin,
      totalDurationSeconds,
      aspectRatio,
      includeCharacters,
      supplementaryText,
      referenceFiles,
    } = promoScriptForm;

    if (!productName || !productFeatures) return;

    setIsGenerating(true);
    setGenerationStage('phase1');
    setErrorMsg(null);

    try {
      const data = await generatePromoScriptData({
        productName,
        productFeatures,
        productContents,
        productOrigin,
        totalDurationSeconds,
        aspectRatio,
        includeCharacters,
        supplementaryText,
        referenceFiles,
        onStageChange: setGenerationStage,
      });

      setPromoScriptData(data);
      pushAssetHistory(historyKey, {
        kind: 'text',
        title: 'PROMO Script Draft',
        value: JSON.stringify(data, null, 2),
      });
    } catch (error: any) {
      console.error('Failed to generate script:', error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('Safety') || errorString.includes('400')) {
        setErrorMsg('內容可能觸發了模型安全限制，請調整產品描述或視覺要求後再試。');
      } else if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額已用盡，請檢查計費或稍後再試。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('模型目前處於高負載狀態，請稍後再試。');
      } else {
        setErrorMsg('腳本生成失敗，請檢查 API 設定或稍後再試。');
      }
    } finally {
      setIsGenerating(false);
      setGenerationStage(null);
    }
  };

  const handleNext = () => {
    if (!currentProjectId) {
      addProjectToHistory();
    }
    markStepCompleted(1);
    setCurrentStep(2);
    navigate('/step3a');
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-wide">1. 產品解構與腳本</h2>
          <p className="text-sm text-orange-400/80 font-mono">PROMO.INIT // 產品資料矩陣與腳本生成</p>
        </div>
        <button
          onClick={() => setHistoryModalOpen(true)}
          disabled={!assetHistory[historyKey]?.length}
          className="mr-2 inline-flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-300 rounded-lg font-medium transition-colors"
          title="開啟文字歷史"
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <button
          onClick={handleNext}
          disabled={!promoScriptData}
          className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          下一步
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 border-r border-neutral-800/50 bg-neutral-900/30 p-6 overflow-y-auto flex flex-col gap-6">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Package className="w-5 h-5" />
            <h3 className="font-semibold">產品資訊輸入</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">產品名稱</label>
              <input
                type="text"
                value={promoScriptForm.productName}
                onChange={(e) => setPromoScriptForm({ productName: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                placeholder="例如：膠原蛋白氣泡飲"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">核心概念 / 賣點</label>
              <textarea
                value={promoScriptForm.productFeatures}
                onChange={(e) => setPromoScriptForm({ productFeatures: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none"
                placeholder="請描述想打的核心價值、功效與受眾感受"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">成分 / 內容物</label>
              <input
                type="text"
                value={promoScriptForm.productContents}
                onChange={(e) => setPromoScriptForm({ productContents: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                placeholder="例如：維他命 C、膠原蛋白、氣泡飲配方"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">產地 / 補充資訊</label>
              <input
                type="text"
                value={promoScriptForm.productOrigin}
                onChange={(e) => setPromoScriptForm({ productOrigin: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                placeholder="例如：日本、台灣製造、冷藏保存"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">總時長（秒）</label>
                <input
                  type="number"
                  min="3"
                  step="1"
                  value={promoScriptForm.totalDurationSeconds}
                  onChange={(e) => setPromoScriptForm({ totalDurationSeconds: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">畫面比例</label>
                <select
                  value={promoScriptForm.aspectRatio}
                  onChange={(e) => setPromoScriptForm({ aspectRatio: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                >
                  <option value="9:16">9:16 直式短影音</option>
                  <option value="16:9">16:9 橫式影片</option>
                  <option value="1:1">1:1 方形版位</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoScriptForm.includeCharacters}
                  onChange={(e) => setPromoScriptForm({ includeCharacters: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-700 text-orange-500 focus:ring-orange-500/50 bg-neutral-950"
                />
                <span className="text-sm font-medium text-neutral-400">允許人物入鏡</span>
              </label>
            </div>

            <div className="pt-4 border-t border-neutral-800/50">
              <label className="block text-sm font-medium text-neutral-400 mb-1">風格設定 / 補充需求</label>
              <textarea
                value={promoScriptForm.supplementaryText}
                onChange={(e) => setPromoScriptForm({ supplementaryText: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none mb-3"
                placeholder="例如：高級精品感、清晨冷調、玻璃質感、開場前 3 秒要很抓眼球"
              />

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-sm cursor-pointer transition-colors border border-neutral-700 w-fit">
                  <Paperclip className="w-4 h-4" />
                  上傳參考素材
                  <input type="file" accept="image/*,video/mp4,video/webm" multiple className="hidden" onChange={handleFileUpload} />
                </label>

                {promoScriptForm.referenceFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {promoScriptForm.referenceFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-400">
                        <span className="truncate" style={{ maxWidth: 120 }}>{file.name}</span>
                        <button onClick={() => removeFile(idx)} className="text-neutral-500 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !promoScriptForm.productName || !promoScriptForm.productFeatures}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors border border-neutral-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {generationStage ? '分段生成中...' : '生成中...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-orange-400" />
                生成 PROMO 腳本與分鏡
              </>
            )}
          </button>

          {generationStage && (
            <div className="mt-3 text-xs text-orange-400/80 font-mono">
              {generationStageText[generationStage]}
            </div>
          )}

          {errorMsg && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        <div className="w-full md:w-2/3 bg-neutral-950/50 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-orange-400 mb-6">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold">腳本與分鏡預覽</h3>
          </div>

          {!promoScriptData && !isGenerating && (
            <div className="h-64 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              先在左側輸入產品資料，再生成腳本與分鏡。
            </div>
          )}

          {isGenerating && (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400 gap-4">
              <DataMatrixLoader size="lg" text={generationStage ? generationStageText[generationStage] : 'AI 正在更新腳本與分鏡...'} />
            </div>
          )}

          {promoScriptData && !isGenerating && (
            <div className="space-y-8">
              {(promoScriptData.creative_rationale || promoScriptData.story_outline) && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {promoScriptData.creative_rationale && (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                      <h4 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider">企劃思路與開場</h4>
                      <div className="whitespace-pre-wrap text-neutral-200 leading-relaxed">
                        {promoScriptData.creative_rationale}
                      </div>
                    </div>
                  )}

                  {promoScriptData.story_outline && (
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                      <h4 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider">故事大綱</h4>
                      <div className="whitespace-pre-wrap text-neutral-200 leading-relaxed">
                        {promoScriptData.story_outline}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">字幕 / 旁白</h4>
                  {promoScriptData.total_duration_seconds && (
                    <span className="text-xs text-orange-400 font-mono">總時長 {promoScriptData.total_duration_seconds} 秒</span>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-lg text-neutral-200 leading-relaxed font-serif">
                  {promoScriptData.script_dialogue}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">分鏡列表</h4>
                {promoScriptData.storyboard.map((scene) => (
                  <div key={scene.scene_number} className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-sm font-mono font-bold">
                        分鏡 {scene.scene_number}
                      </span>
                      <div className="flex items-center gap-3">
                        {scene.default_shot_size && (
                          <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2.5 py-1 font-mono">
                            {scene.default_shot_size}
                          </span>
                        )}
                        {scene.duration_seconds && (
                          <span className="text-xs text-neutral-400 font-mono">{scene.duration_seconds} 秒</span>
                        )}
                      </div>
                    </div>

                    {scene.scene_outline && (
                      <div>
                        <div className="text-sm text-neutral-400 mb-2">分鏡大綱</div>
                        <div className="text-neutral-200 leading-relaxed">{scene.scene_outline}</div>
                      </div>
                    )}

                    {scene.scene_location && (
                      <div>
                        <div className="text-sm text-neutral-400 mb-2">場景設定</div>
                        <div className="text-neutral-200 leading-relaxed">{scene.scene_location}</div>
                      </div>
                    )}

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {scene.camera_setup && (
                        <div className="bg-black/30 p-4 rounded-xl border border-neutral-800/50">
                          <div className="text-sm text-neutral-400 mb-2">鏡頭設定</div>
                          <div className="text-neutral-200">{scene.camera_setup}</div>
                        </div>
                      )}
                      {scene.audio_design && (
                        <div className="bg-black/30 p-4 rounded-xl border border-neutral-800/50">
                          <div className="text-sm text-neutral-400 mb-2">聲音設定</div>
                          <div className="text-neutral-200">{scene.audio_design}</div>
                        </div>
                      )}
                    </div>

                    {scene.subtitle_voiceover && (
                      <div className="bg-black/30 p-4 rounded-xl border border-neutral-800/50">
                        <div className="text-sm text-neutral-400 mb-2">字幕 / 旁白</div>
                        <div className="whitespace-pre-wrap text-neutral-100 leading-relaxed">{scene.subtitle_voiceover}</div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <div className="text-sm text-neutral-400 font-mono">視覺指令 (Start Frame)</div>
                        <div className="bg-black/60 p-5 rounded-xl text-base text-neutral-100 font-mono border border-neutral-700">
                          {scene.nano_banana_pro_prompts.start_frame}
                        </div>
                        <div className="text-sm text-neutral-400 italic">{scene.nano_banana_pro_prompts.start_frame_zh}</div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-sm text-neutral-400 font-mono">收尾提示詞 (End Frame)</div>
                        <div className="bg-black/60 p-5 rounded-xl text-base text-neutral-100 font-mono border border-neutral-700">
                          {scene.nano_banana_pro_prompts.end_frame}
                        </div>
                        <div className="text-sm text-neutral-400 italic">{scene.nano_banana_pro_prompts.end_frame_zh}</div>
                      </div>
                    </div>

                    {(scene.continuity_summary || scene.continuity_prompt) && (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {scene.continuity_summary && (
                          <div className="bg-black/30 p-4 rounded-xl border border-neutral-800/50">
                            <div className="text-sm text-neutral-400 mb-2">首尾幀畫面連貫大綱</div>
                            <div className="text-neutral-200 leading-relaxed">{scene.continuity_summary}</div>
                          </div>
                        )}
                        {scene.continuity_prompt && (
                          <div className="bg-black/30 p-4 rounded-xl border border-neutral-800/50">
                            <div className="text-sm text-neutral-400 mb-2">首尾幀畫面連貫提示詞</div>
                            <div className="text-neutral-100 font-mono text-sm">{scene.continuity_prompt.en}</div>
                            <div className="text-neutral-400 mt-2 text-sm">{scene.continuity_prompt.zh}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {scene.transition && (
                      <div className="bg-black/30 p-4 rounded-xl border border-neutral-800/50 space-y-3">
                        <div className="text-sm text-neutral-400">轉場邏輯與提示詞</div>
                        <div className="text-neutral-200 leading-relaxed">{scene.transition.logic}</div>
                        <div className="text-neutral-100 font-mono text-sm">{scene.transition.prompt_en}</div>
                        <div className="text-neutral-400 text-sm">{scene.transition.prompt_zh}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-orange-400">
                  <MessageSquareText className="w-5 h-5" />
                  <h4 className="text-sm font-medium uppercase tracking-wider text-neutral-300">AI 微調對話</h4>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        'p-3 rounded-lg text-sm',
                        msg.role === 'user'
                          ? 'bg-orange-500/10 text-orange-100 ml-auto max-w-[80%]'
                          : 'bg-neutral-800 text-neutral-300 mr-auto max-w-[80%]',
                      )}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="例如：把前 3 秒改得更抓眼球，或把人物拿掉"
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={isGenerating || !chatInput.trim()}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
                  >
                    送出
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <AssetHistoryModal
        open={historyModalOpen}
        title="PROMO Script History"
        entries={assetHistory[historyKey] || []}
        onClose={() => setHistoryModalOpen(false)}
        onRestore={(entry) => {
          try {
            const parsed = JSON.parse(entry.value);
            setPromoScriptData(parsed);
            setHistoryModalOpen(false);
          } catch (error) {
            console.error('Failed to restore promo script history:', error);
          }
        }}
      />
    </div>
  );
}
