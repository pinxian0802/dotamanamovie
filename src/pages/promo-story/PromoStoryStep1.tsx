import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Eraser, FolderOpen, Loader2 } from 'lucide-react';
import { useProjectStore, type PromoStoryboardScene } from '../../store/useProjectStore';
import AssetHistoryModal from '../../components/AssetHistoryModal';

const SYSTEM_PROMPT = `
你現在是一位好萊塢級別的「影視分鏡導演與 AI 提示詞工程師」。
你的任務是接收使用者提供的自由格式故事腳本，將其精準拆解成符合總時長的分鏡列表，同時為每個分鏡產出完整的 AI 圖像與影片提示詞，供後續 Veo 影片生成使用。

【核心規則】
- 所有分鏡 duration_seconds 加總必須等於總時長
- default_shot_size 只能從以下選一：medium close-up、close-up、extreme close-up、macro shot
- start_frame 與 end_frame 必須在同一物理時空，end_frame 只能改變主體狀態或攝影機視角，絕對禁止換背景
- continuity_prompt.en 控制在 50 個英文單字以內
- 最後一顆分鏡的 transition.logic 填入：Final shot, no transition needed.
- 請只輸出純 JSON 陣列，禁止附加 Markdown code fence、前言或額外解釋
`.trim();

const aspectRatioOptions = [
  { value: '9:16', label: '9:16 豎屏' },
  { value: '16:9', label: '16:9 橫屏' },
  { value: '1:1', label: '1:1 正方形' },
  { value: '4:5', label: '4:5 IG 肖像' },
] as const;

const durationOptions = [15, 30, 45, 60, 90] as const;

const progressMessages = [
  'AI 正在閱讀你的腳本脈絡...',
  'AI 正在拆解分鏡與鏡頭節奏...',
  'AI 正在撰寫首尾幀與 Veo 提示詞...',
  'AI 正在整理可交付的 JSON 結果...',
] as const;

const exampleScript = `開場是一個冷色調的實驗室桌面，玻璃滴管將藍色精華滴進透明水中。

鏡頭快速推近，液體像銀河一樣擴散，字幕出現「不是保養，是重開機」。

下一鏡切到女生熬夜後暗沉的臉，她把精華抹開，表情從緊繃變成鬆開。

最後鏡頭拉遠，產品瓶身站在桌面中央，旁邊保留剛剛的滴管與水痕，燈光仍維持同方向冷白光。`;

const stripJsonFence = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const genericFence = trimmed.match(/```\s*([\s\S]*?)\s*```/i);
  if (genericFence?.[1]) return genericFence[1].trim();
  return trimmed;
};

const estimateSceneCount = (duration: number, charCount: number) => {
  const byDuration = Math.max(1, Math.ceil(duration / 5));
  const byDensity = Math.max(1, Math.ceil(charCount / 90));
  return Math.max(byDuration, byDensity);
};

const autoResize = (element: HTMLTextAreaElement | null) => {
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${Math.max(340, element.scrollHeight)}px`;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: {
    message?: string;
  };
};

export default function PromoStoryStep1() {
  const navigate = useNavigate();
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const {
    apiKey,
    storyData,
    setStoryData,
    setPromoScriptData,
    setPromoScriptForm,
    recordGeminiUsage,
    markStepCompleted,
    setCurrentStep,
    workflowType,
    setWorkflowType,
    setWorkflowVariant,
    currentProjectId,
    addProjectToHistory,
    promoScriptData,
    assetHistory,
    pushAssetHistory,
  } = useProjectStore();

  const initialAspect = React.useMemo(() => {
    const storedAspect = (promoScriptData as any)?.aspectRatio;
    if (typeof storedAspect === 'string') return storedAspect;
    return '9:16';
  }, [promoScriptData]);

  const initialDuration = React.useMemo(() => {
    const storedDuration = (promoScriptData as any)?.totalDurationSeconds;
    if (typeof storedDuration === 'number' && Number.isFinite(storedDuration)) return storedDuration;
    if (typeof promoScriptData?.total_duration_seconds === 'number' && Number.isFinite(promoScriptData.total_duration_seconds)) {
      return promoScriptData.total_duration_seconds;
    }
    return 30;
  }, [promoScriptData]);

  const [script, setScript] = React.useState<string>(() => {
    const storedScript = (promoScriptData as any)?.rawScript;
    return typeof storedScript === 'string' && storedScript.trim() ? storedScript : storyData || '';
  });
  const [aspectRatio, setAspectRatio] = React.useState<string>(initialAspect);
  const [duration, setDuration] = React.useState<number>(initialDuration);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [statusIndex, setStatusIndex] = React.useState(0);
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);
  const historyKey = 'promo-story-step1';

  React.useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  React.useEffect(() => {
    if (workflowType !== 'promo') {
      setWorkflowType('promo');
    }
    setWorkflowVariant('promo-story');
  }, [setWorkflowType, setWorkflowVariant, workflowType]);

  React.useEffect(() => {
    autoResize(textareaRef.current);
  }, [script]);

  React.useEffect(() => {
    setPromoScriptForm({
      aspectRatio,
      totalDurationSeconds: String(duration),
    });
  }, [aspectRatio, duration, setPromoScriptForm]);

  React.useEffect(() => {
    if (!isGenerating) {
      setProgress(0);
      setStatusIndex(0);
      return;
    }

    const progressTimer = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        const increment = current < 40 ? 9 : current < 70 ? 5 : 2;
        return Math.min(92, current + increment);
      });
    }, 420);

    const statusTimer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % progressMessages.length);
    }, 1100);

    return () => {
      window.clearInterval(progressTimer);
      window.clearInterval(statusTimer);
    };
  }, [isGenerating]);

  const charCount = script.trim().length;
  const estimatedSceneCount = estimateSceneCount(duration, charCount);

  const handleScriptChange = (value: string) => {
    setScript(value);
    setStoryData(value);
  };

  const handleClear = () => {
    handleScriptChange('');
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    const trimmedScript = script.trim();
    if (!trimmedScript) {
      setErrorMsg('請先輸入故事腳本，再進行分鏡拆解。');
      return;
    }

    if (!apiKey.trim()) {
      setErrorMsg('尚未設定 Gemini API Key，請先前往 /api-key 頁面完成設定。');
      return;
    }

    setIsGenerating(true);
    setProgress(8);
    setStatusIndex(0);
    setErrorMsg(null);

    try {
      const userPrompt = `
【影片規格】
- 畫面比例：${aspectRatio}
- 總時長：${duration} 秒

【故事腳本】
${trimmedScript}

請將腳本拆解成分鏡列表，每個分鏡輸出以下結構，最終回傳 JSON 陣列：
[
  {
    "scene_number": 1,
    "scene_location": "場景設定描述",
    "scene_outline": "畫面視覺主體與動作",
    "duration_seconds": 5,
    "default_shot_size": "medium close-up",
    "camera_setup": "具體運鏡描述（使用電影術語）",
    "audio_design": "聲音設計描述",
    "subtitle_voiceover": "對應旁白或字幕文字",
    "nano_banana_pro_prompts": {
      "start_frame": "首幀英文圖像提示詞",
      "start_frame_zh": "首幀中文翻譯",
      "end_frame": "尾幀英文圖像提示詞（繼承首幀所有場景參數，只改主體狀態或鏡頭視角）",
      "end_frame_zh": "尾幀中文翻譯"
    },
    "continuity_summary": "繁體中文畫面與動態簡述",
    "continuity_prompt": {
      "en": "Veo Motion & Audio Prompt，50字英文以內",
      "zh": "中文翻譯"
    },
    "transition": {
      "logic": "轉場邏輯",
      "prompt_en": "英文轉場提示詞",
      "prompt_zh": "中文轉場提示詞"
    }
  }
]
`.trim();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: [
              {
                role: 'user',
                parts: [{ text: userPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.72,
              maxOutputTokens: 8192,
            },
          }),
        },
      );

      const json = (await response.json()) as GeminiGenerateResponse;
      if (!response.ok || json.error?.message) {
        throw new Error(json.error?.message || 'Gemini API 呼叫失敗');
      }

      const responseText = json.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n').trim();
      if (!responseText) {
        throw new Error('Gemini 沒有回傳可解析的內容。');
      }

      const parsed = JSON.parse(stripJsonFence(responseText)) as PromoStoryboardScene[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Gemini 回傳的分鏡格式不正確。');
      }

      const promptTokens = json.usageMetadata?.promptTokenCount || 0;
      const outputTokens = json.usageMetadata?.candidatesTokenCount || 0;
      const estimatedCostUsd = (promptTokens / 1_000_000) * 0.5 + (outputTokens / 1_000_000) * 3;

      recordGeminiUsage('gemini-3-flash-preview', {
        calls: 1,
        promptTokens,
        outputTokens,
        estimatedCostUsd,
      });

      setPromoScriptForm({
        aspectRatio,
        totalDurationSeconds: String(duration),
      });

      setPromoScriptData({
        workflow: 'promo-story',
        storyboard: parsed,
        aspectRatio,
        totalDurationSeconds: duration,
        rawScript: trimmedScript,
        total_duration_seconds: duration,
        creative_rationale: '（由手動腳本生成）',
        story_outline: trimmedScript.slice(0, 300),
        script_dialogue: trimmedScript,
      } as any);
      pushAssetHistory(historyKey, {
        kind: 'text',
        title: 'PROMO STORY Script Draft',
        value: JSON.stringify(
          {
            workflow: 'promo-story',
            storyboard: parsed,
            aspectRatio,
            totalDurationSeconds: duration,
            rawScript: trimmedScript,
            total_duration_seconds: duration,
            story_outline: trimmedScript.slice(0, 300),
            script_dialogue: trimmedScript,
          },
          null,
          2,
        ),
      });

      setProgress(100);
    } catch (error) {
      console.error('Failed to generate promo story storyboard:', error);
      const message = error instanceof Error ? error.message : '故事腳本拆解失敗，請稍後再試。';
      setErrorMsg(message.includes('/api-key') ? message : `故事腳本拆解失敗：${message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAndNext = () => {
    if (!promoScriptData?.storyboard?.length) return;
    if (!currentProjectId) {
      addProjectToHistory();
    }
    markStepCompleted(1);
    setCurrentStep(2);
    navigate('/promo-story/step2');
  };

  return (
    <div className="min-h-screen bg-transparent relative z-10">
      <div className="mx-auto flex max-w-[1600px] gap-6 px-6 py-8">
        <aside className="hidden md:block w-[216px] shrink-0">
          <div className="sticky top-6 space-y-6">
            <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/85 p-5 backdrop-blur-xl">
              <div className="mb-4">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  PROMO STORY
                </button>
              </div>
              <div className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Workflow</div>
              <div className="space-y-3">
                {[
                  '故事腳本分鏡',
                  '產品視覺注入與首尾影格',
                  '動態插幀與影片生成',
                  '轉場縫合生成',
                ].map((label, index) => (
                  <div
                    key={label}
                    className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                      index === 0
                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-300 shadow-[0_0_20px_rgba(249,115,22,0.12)]'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-500'
                    }`}
                  >
                    <div className="font-mono text-xs uppercase tracking-[0.22em] text-neutral-500">Step {index + 1}</div>
                    <div className="mt-1 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/85 p-5 backdrop-blur-xl">
              <div className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">Spec</div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">畫面比例</span>
                  <span className="font-mono text-neutral-200">{aspectRatio}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">影片時長</span>
                  <span className="font-mono text-neutral-200">{duration} 秒</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">預估分鏡數</span>
                  <span className="font-mono text-neutral-200">{estimatedSceneCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">字數</span>
                  <span className="font-mono text-neutral-200">{charCount}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-[28px] border border-neutral-800/60 bg-neutral-950/78 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex flex-col gap-4 border-b border-neutral-800/60 px-8 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-wide text-white">故事腳本分鏡</h1>
                <p className="max-w-3xl text-sm leading-relaxed text-neutral-400">
                  輸入你的故事腳本，AI 將自動拆解為逐格分鏡與 Veo 提示詞。
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHistoryModalOpen(true)}
                  disabled={!assetHistory[historyKey]?.length}
                  className="inline-flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-3 text-neutral-300 transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  title="生成歷史資料夾"
                >
                  <FolderOpen className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isGenerating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  儲存並下一步
                </button>
              </div>
            </div>

            <div className="px-8 py-6">
              <textarea
                ref={textareaRef}
                value={script}
                onChange={(event) => handleScriptChange(event.target.value)}
                placeholder={exampleScript}
                spellCheck={false}
                className="min-h-[340px] w-full resize-none rounded-2xl border border-neutral-800 bg-black/30 px-5 py-5 font-mono text-[15px] leading-7 text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-orange-500/40"
              />

              <div className="mt-3 flex items-center justify-between rounded-2xl border border-neutral-800/60 bg-neutral-900/60 px-4 py-3 text-sm">
                <div className="font-mono text-neutral-500">{charCount} chars</div>
                <button
                  onClick={handleClear}
                  className="inline-flex items-center gap-2 text-neutral-400 transition-colors hover:text-red-300"
                >
                  <Eraser className="h-4 w-4" />
                  清空
                </button>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleConfirmAndNext}
                  disabled={!promoScriptData?.storyboard?.length || isGenerating}
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-500"
                >
                  <ArrowRight className="h-4 w-4" />
                  確認並前往下一步
                </button>
              </div>

              {isGenerating && (
                <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-orange-300">{progressMessages[statusIndex]}</span>
                    <span className="font-mono text-orange-400">{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-indigo-400 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-sm text-red-300">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-2">
                      <div>{errorMsg}</div>
                      {!apiKey.trim() && (
                        <button
                          onClick={() => navigate('/api-key')}
                          className="text-red-200 underline underline-offset-4 hover:text-white"
                        >
                          前往 API Key 設定頁
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-neutral-800/60 px-8 py-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="text-sm font-medium text-neutral-400">畫面比例:</div>
                  <div className="flex flex-wrap gap-2">
                    {aspectRatioOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setAspectRatio(option.value)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          aspectRatio === option.value
                            ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                            : 'border-neutral-800 bg-neutral-900/70 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="text-sm font-medium text-neutral-400">影片時長:</div>
                  <div className="flex flex-wrap gap-2">
                    {durationOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => setDuration(option)}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          duration === option
                            ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300'
                            : 'border-neutral-800 bg-neutral-900/70 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {option}秒
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <AssetHistoryModal
        open={historyModalOpen}
        title="PROMO STORY Script History"
        entries={assetHistory[historyKey] || []}
        onClose={() => setHistoryModalOpen(false)}
        onRestore={(entry) => {
          try {
            const parsed = JSON.parse(entry.value);
            setPromoScriptData(parsed);
            setStoryData(parsed.rawScript || parsed.script_dialogue || '');
            setHistoryModalOpen(false);
          } catch (error) {
            console.error('Failed to restore promo story history:', error);
          }
        }}
      />
    </div>
  );
}
