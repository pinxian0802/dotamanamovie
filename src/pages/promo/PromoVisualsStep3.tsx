import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../store/useProjectStore';
import MediaPreviewModal from '../../components/MediaPreviewModal';
import {
  adjustPromoFramePromptWithReferences,
  GeminiReferenceFile,
  PromoFramePromptResult,
  generateImage,
} from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';

type PromptField = 'start_frame' | 'start_frame_zh' | 'end_frame' | 'end_frame_zh';
type FrameType = 'start' | 'end';

type SceneReferenceImage = GeminiReferenceFile & {
  id: string;
  name: string;
  previewUrl: string;
};

const getFrameAdjustKey = (sceneNumber: number, frameType: FrameType) => `${sceneNumber}-${frameType}`;

const getFramePromptFields = (frameType: FrameType): { prompt: PromptField; promptZh: PromptField } =>
  frameType === 'start'
    ? { prompt: 'start_frame', promptZh: 'start_frame_zh' }
    : { prompt: 'end_frame', promptZh: 'end_frame_zh' };

const readReferenceImage = (file: File): Promise<SceneReferenceImage> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Invalid file data'));
        return;
      }

      const match = reader.result.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!match) {
        reject(new Error('Unsupported image format'));
        return;
      }

      resolve({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        previewUrl: reader.result,
        mimeType: file.type || match[1],
        data: match[2],
      });
    };

    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });

export default function PromoVisualsStep3() {
  const navigate = useNavigate();
  const {
    promoScriptData,
    promoImages,
    promoImageConfirmed,
    setPromoImage,
    setPromoImageConfirmed,
    markStepCompleted,
    setCurrentStep,
    updatePromoScenePrompts,
  } = useProjectStore();

  const [baseImages, setBaseImages] = useState<string[]>([]);
  const [frameReferenceImages, setFrameReferenceImages] = useState<Record<string, SceneReferenceImage[]>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});
  const [adjustInputs, setAdjustInputs] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);
  const baseImageInputRef = useRef<HTMLInputElement>(null);

  const handleBaseImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          setBaseImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });

    event.target.value = '';
  };

  const handleFrameReferenceUpload = async (
    sceneNumber: number,
    frameType: FrameType,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files?.length) return;

    try {
      const references = await Promise.all(Array.from(files).map(readReferenceImage));
      const adjustKey = getFrameAdjustKey(sceneNumber, frameType);
      setFrameReferenceImages((prev) => ({
        ...prev,
        [adjustKey]: [...(prev[adjustKey] || []), ...references],
      }));
    } catch (error) {
      console.error('Failed to read scene reference images:', error);
      setErrorMsg('參考圖讀取失敗，請換一張圖片再試。');
    } finally {
      event.target.value = '';
    }
  };

  const removeBaseImage = (index: number) => {
    setBaseImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const removeFrameReferenceImage = (sceneNumber: number, frameType: FrameType, imageId: string) => {
    const adjustKey = getFrameAdjustKey(sceneNumber, frameType);
    setFrameReferenceImages((prev) => ({
      ...prev,
      [adjustKey]: (prev[adjustKey] || []).filter((image) => image.id !== imageId),
    }));
  };

  const handlePromptFieldChange = (sceneNumber: number, field: PromptField, value: string) => {
    updatePromoScenePrompts(sceneNumber, { [field]: value });
  };

  const handleFrameUpload = async (
    sceneNumber: number,
    type: 'start' | 'end',
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadedImage = await readReferenceImage(file);
      setPromoImage(sceneNumber, type, uploadedImage.previewUrl);
      setErrorMsg(null);
    } catch (error) {
      console.error(`Failed to upload ${type} frame for scene ${sceneNumber}:`, error);
      setErrorMsg(`${type === 'start' ? '首幀' : '尾幀'}圖片上傳失敗，請換一張圖片再試。`);
    } finally {
      event.target.value = '';
    }
  };

  const generateSceneImage = async (sceneNumber: number, type: 'start' | 'end', prompt: string) => {
    const key = `${sceneNumber}-${type}`;
    setGenerating((prev) => ({ ...prev, [key]: true }));
    setErrorMsg(null);

    try {
      const referenceImage =
        type === 'end' && promoImages[sceneNumber]?.start ? promoImages[sceneNumber].start : baseImages[0];

      const imageUrl = await generateImage(prompt, '9:16', referenceImage);
      setPromoImage(sceneNumber, type, imageUrl);
    } catch (error: any) {
      console.error(`Failed to generate ${type} image for scene ${sceneNumber}:`, error);
      const errorString = error?.message || JSON.stringify(error) || '';

      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額暫時不足，請稍後再試或更換可用的 API Key。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('影像服務暫時不可用，請稍後重新生成。');
      } else {
        setErrorMsg(`分鏡 ${sceneNumber} 的${type === 'start' ? '首幀' : '尾幀'}生成失敗，請稍後再試。`);
      }
    } finally {
      setGenerating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const toggleConfirm = (sceneNumber: number, type: 'start' | 'end') => {
    const key = `${sceneNumber}-${type}`;
    setPromoImageConfirmed(key, !promoImageConfirmed[key]);
  };

  const handlePromptAdjust = async (
    sceneNumber: number,
    frameType: FrameType,
    currentPrompt: PromoFramePromptResult,
  ) => {
    const adjustKey = getFrameAdjustKey(sceneNumber, frameType);
    const userInput = adjustInputs[adjustKey]?.trim();
    if (!userInput) return;

    setAdjusting((prev) => ({ ...prev, [adjustKey]: true }));
    setErrorMsg(null);

    try {
      const references = (frameReferenceImages[adjustKey] || []).map(({ previewUrl, id, name, ...file }) => file);
      const data = await adjustPromoFramePromptWithReferences(frameType, userInput, currentPrompt, references);
      const fields = getFramePromptFields(frameType);
      updatePromoScenePrompts(sceneNumber, {
        [fields.prompt]: data.prompt,
        [fields.promptZh]: data.prompt_zh,
      });
      setAdjustInputs((prev) => ({ ...prev, [adjustKey]: '' }));
    } catch (error) {
      console.error('Adjust prompt error:', error);
      setErrorMsg('提示詞調整失敗，請稍後再試，或直接手動修改上方提示詞。');
    } finally {
      setAdjusting((prev) => ({ ...prev, [adjustKey]: false }));
    }
  };

  const handleNext = () => {
    markStepCompleted(2);
    setCurrentStep(3);
    navigate('/step4a');
  };

  const handleBack = () => {
    navigate('/step2a');
  };

  const allConfirmed = promoScriptData?.storyboard.every(
    (scene) => promoImageConfirmed[`${scene.scene_number}-start`] && promoImageConfirmed[`${scene.scene_number}-end`],
  );

  if (!promoScriptData) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        請先完成產品腳本與分鏡生成，再進入這一步。
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-full flex-col overflow-hidden bg-transparent">
      <div className="shrink-0 border-b border-neutral-800/50 bg-neutral-950/60 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-white">2. 產品視覺注入與首尾影格</h2>
              <p className="text-sm font-mono text-orange-400/80">
                PROMO.VISUALS // 先調整提示詞，再手動生成首幀與尾幀
              </p>
            </div>
          </div>
          <button
            onClick={handleNext}
            disabled={!allConfirmed}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2 font-medium text-white transition-colors hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500"
          >
            前往下一步
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
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

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="mb-4 flex items-center gap-2 text-orange-400">
              <Upload className="h-5 w-5" />
              <h3 className="font-semibold">產品實拍墊圖</h3>
            </div>
            <p className="mb-4 text-sm text-neutral-400">
              這裡可先放產品實拍或包裝圖，供首幀與尾幀生成時當作主要參考。進到頁面後不會自動生圖，會等你自己按生成。
            </p>

            <div className="flex flex-wrap gap-4">
              {baseImages.map((image, index) => (
                <div key={`${image}-${index}`} className="group relative h-24 w-24 overflow-hidden rounded-xl border border-neutral-700">
                  <img src={image} alt={`Base reference ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeBaseImage(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => baseImageInputRef.current?.click()}
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950/50 text-neutral-500 transition-colors hover:border-orange-500/50 hover:text-orange-400"
              >
                <Upload className="mb-1 h-6 w-6" />
                <span className="text-xs">上傳圖片</span>
              </button>

              <input
                ref={baseImageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleBaseImageUpload}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-orange-400">
              <ImageIcon className="h-5 w-5" />
              <h3 className="font-semibold">首尾幀監看與提示詞微調</h3>
            </div>

            {promoScriptData.storyboard.map((scene) => {
              const startKey = `${scene.scene_number}-start`;
              const endKey = `${scene.scene_number}-end`;
              const generatedImages = promoImages[scene.scene_number];
              const startReferences = frameReferenceImages[startKey] || [];
              const endReferences = frameReferenceImages[endKey] || [];
              const uploadedReferences = [...startReferences, ...endReferences];

              return (
                <div key={scene.scene_number} className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-6">
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-orange-500/30 bg-orange-500/20 px-3 py-1 text-sm font-bold text-orange-400">
                        分鏡 {scene.scene_number}
                      </span>
                      {scene.default_shot_size && (
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-cyan-300">
                          {scene.default_shot_size}
                        </span>
                      )}
                    </div>

                    {scene.scene_outline && <p className="max-w-2xl text-sm text-neutral-400">{scene.scene_outline}</p>}
                  </div>

                  <div className="mb-4 rounded-xl border border-neutral-800 bg-black/20 px-4 py-3 text-sm text-neutral-300">
                    這一頁的提示詞可以直接修改。若 Gemini 生出
                    <span className="mx-1 font-semibold text-orange-300">Extreme Close-Up</span>
                    ，你可以直接改成
                    <span className="mx-1 font-semibold text-emerald-300">Close-Up</span>
                    或
                    <span className="mx-1 font-semibold text-emerald-300">Medium Close-Up</span>
                    ，再按生成。
                  </div>

                  <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-neutral-300">首幀 Start Frame</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (generatedImages?.start) {
                                downloadAsset(generatedImages.start, `scene_${scene.scene_number}_start.jpg`);
                              }
                            }}
                            disabled={!generatedImages?.start}
                            className="rounded-md bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                            title="下載首幀"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <label
                            className={clsx(
                              'rounded-md bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700',
                              (generating[startKey] || promoImageConfirmed[startKey]) && 'cursor-not-allowed opacity-50',
                            )}
                            title="上傳首幀"
                          >
                            <Upload className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={generating[startKey] || promoImageConfirmed[startKey]}
                              onChange={(event) => handleFrameUpload(scene.scene_number, 'start', event)}
                            />
                          </label>
                          <button
                            onClick={() =>
                              generateSceneImage(scene.scene_number, 'start', scene.nano_banana_pro_prompts.start_frame)
                            }
                            disabled={generating[startKey] || promoImageConfirmed[startKey]}
                            className="rounded-md bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                            title="重新生成首幀"
                          >
                            <RefreshCw className={clsx('h-4 w-4', generating[startKey] && 'animate-spin')} />
                          </button>
                          <button
                            onClick={() => toggleConfirm(scene.scene_number, 'start')}
                            disabled={!generatedImages?.start}
                            className={clsx(
                              'flex items-center gap-1 rounded-md p-1.5 text-xs font-medium transition-colors',
                              promoImageConfirmed[startKey]
                                ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-50',
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            確認
                          </button>
                        </div>
                      </div>

                      <div
                        className="relative flex w-full max-w-xs items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
                        style={{ aspectRatio: '9 / 16' }}
                      >
                        {generatedImages?.start ? (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                src: generatedImages.start,
                                title: `分鏡 ${scene.scene_number} 首幀`,
                              })
                            }
                            className="h-full w-full"
                          >
                            <img src={generatedImages.start} alt="Start Frame" className="h-full w-full object-cover" />
                          </button>
                        ) : generating[startKey] ? (
                          <div className="flex flex-col items-center gap-2 text-orange-500">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="text-xs font-mono animate-pulse">生成中...</span>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                              generateSceneImage(scene.scene_number, 'start', scene.nano_banana_pro_prompts.start_frame)
                            }
                            className="flex flex-col items-center gap-2 text-orange-500 transition-colors hover:text-orange-400"
                          >
                            <RefreshCw className="h-8 w-8" />
                            <span className="text-xs font-medium">生成首幀</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-3 rounded-xl border border-neutral-800/60 bg-black/30 p-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            Start Prompt EN
                          </label>
                          <textarea
                            value={scene.nano_banana_pro_prompts.start_frame}
                            onChange={(event) =>
                              handlePromptFieldChange(scene.scene_number, 'start_frame', event.currentTarget.value)
                            }
                            rows={5}
                            className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            Start Prompt ZH
                          </label>
                          <textarea
                            value={scene.nano_banana_pro_prompts.start_frame_zh}
                            onChange={(event) =>
                              handlePromptFieldChange(scene.scene_number, 'start_frame_zh', event.currentTarget.value)
                            }
                            rows={3}
                            className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-orange-300">
                          <Sparkles className="h-4 w-4" />
                          AI Assist for Start Frame
                        </div>
                        <div className="mb-4 rounded-xl border border-neutral-800/60 bg-black/20 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-neutral-200">Start frame references</div>
                              <div className="text-xs text-neutral-400">
                                Upload pose, face, product, styling, or scene images just for the start frame prompt.
                              </div>
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 transition-colors hover:border-orange-500/50 hover:text-orange-300">
                              <Upload className="h-4 w-4" />
                              Upload refs
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(event) => handleFrameReferenceUpload(scene.scene_number, 'start', event)}
                              />
                            </label>
                          </div>

                          {startReferences.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                              {startReferences.map((image) => (
                                <div
                                  key={image.id}
                                  className="group relative w-24 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900"
                                >
                                  <div className="aspect-square overflow-hidden">
                                    <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="truncate border-t border-neutral-800 px-2 py-1 text-[11px] text-neutral-400">
                                    {image.name}
                                  </div>
                                  <button
                                    onClick={() => removeFrameReferenceImage(scene.scene_number, 'start', image.id)}
                                    className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-5 text-sm text-neutral-500">
                              No start-frame references yet. Add images if you want Gemini to follow a specific look.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                          <input
                            type="text"
                            value={adjustInputs[startKey] || ''}
                            onChange={(event) => {
                              const nextValue = event.currentTarget.value;
                              setAdjustInputs((prev) => ({
                                ...prev,
                                [startKey]: nextValue,
                              }));
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                handlePromptAdjust(scene.scene_number, 'start', {
                                  prompt: scene.nano_banana_pro_prompts.start_frame,
                                  prompt_zh: scene.nano_banana_pro_prompts.start_frame_zh,
                                });
                              }
                            }}
                            disabled={adjusting[startKey]}
                            placeholder={`Tell Gemini how to refine scene ${scene.scene_number} start frame.`}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 disabled:opacity-50"
                          />
                          <button
                            onClick={() =>
                              handlePromptAdjust(scene.scene_number, 'start', {
                                prompt: scene.nano_banana_pro_prompts.start_frame,
                                prompt_zh: scene.nano_banana_pro_prompts.start_frame_zh,
                              })
                            }
                            disabled={adjusting[startKey] || !adjustInputs[startKey]?.trim()}
                            className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {adjusting[startKey] ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Adjusting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                AI adjust start
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-neutral-300">尾幀 End Frame</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (generatedImages?.end) {
                                downloadAsset(generatedImages.end, `scene_${scene.scene_number}_end.jpg`);
                              }
                            }}
                            disabled={!generatedImages?.end}
                            className="rounded-md bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                            title="下載尾幀"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <label
                            className={clsx(
                              'rounded-md bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700',
                              (generating[endKey] || promoImageConfirmed[endKey]) && 'cursor-not-allowed opacity-50',
                            )}
                            title="上傳尾幀"
                          >
                            <Upload className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={generating[endKey] || promoImageConfirmed[endKey]}
                              onChange={(event) => handleFrameUpload(scene.scene_number, 'end', event)}
                            />
                          </label>
                          <button
                            onClick={() =>
                              generateSceneImage(scene.scene_number, 'end', scene.nano_banana_pro_prompts.end_frame)
                            }
                            disabled={generating[endKey] || promoImageConfirmed[endKey] || !promoImageConfirmed[startKey]}
                            className="rounded-md bg-neutral-800 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                            title="重新生成尾幀"
                          >
                            <RefreshCw className={clsx('h-4 w-4', generating[endKey] && 'animate-spin')} />
                          </button>
                          <button
                            onClick={() => toggleConfirm(scene.scene_number, 'end')}
                            disabled={!generatedImages?.end}
                            className={clsx(
                              'flex items-center gap-1 rounded-md p-1.5 text-xs font-medium transition-colors',
                              promoImageConfirmed[endKey]
                                ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 disabled:opacity-50',
                            )}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            確認
                          </button>
                        </div>
                      </div>

                      <div
                        className="relative flex w-full max-w-xs items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950"
                        style={{ aspectRatio: '9 / 16' }}
                      >
                        {generatedImages?.end ? (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                src: generatedImages.end,
                                title: `分鏡 ${scene.scene_number} 尾幀`,
                              })
                            }
                            className="h-full w-full"
                          >
                            <img src={generatedImages.end} alt="End Frame" className="h-full w-full object-cover" />
                          </button>
                        ) : generating[endKey] ? (
                          <div className="flex flex-col items-center gap-2 text-orange-500">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span className="text-xs font-mono animate-pulse">生成中...</span>
                          </div>
                        ) : promoImageConfirmed[startKey] ? (
                          <button
                            onClick={() =>
                              generateSceneImage(scene.scene_number, 'end', scene.nano_banana_pro_prompts.end_frame)
                            }
                            className="flex flex-col items-center gap-2 text-orange-500 transition-colors hover:text-orange-400"
                          >
                            <RefreshCw className="h-8 w-8" />
                            <span className="text-xs font-medium">生成尾幀</span>
                          </button>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-neutral-600">
                            <ImageIcon className="h-8 w-8 opacity-50" />
                            <span className="px-4 text-center text-xs">
                              請先確認首幀
                              <br />
                              再用 AI 生成尾幀，或直接用右上角上傳
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 rounded-xl border border-neutral-800/60 bg-black/30 p-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            End Prompt EN
                          </label>
                          <textarea
                            value={scene.nano_banana_pro_prompts.end_frame}
                            onChange={(event) =>
                              handlePromptFieldChange(scene.scene_number, 'end_frame', event.currentTarget.value)
                            }
                            rows={5}
                            className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">
                            End Prompt ZH
                          </label>
                          <textarea
                            value={scene.nano_banana_pro_prompts.end_frame_zh}
                            onChange={(event) =>
                              handlePromptFieldChange(scene.scene_number, 'end_frame_zh', event.currentTarget.value)
                            }
                            rows={3}
                            className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-300 outline-none transition-colors focus:border-orange-500/60"
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm text-orange-300">
                          <Sparkles className="h-4 w-4" />
                          AI Assist for End Frame
                        </div>
                        <div className="mb-4 rounded-xl border border-neutral-800/60 bg-black/20 p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium text-neutral-200">End frame references</div>
                              <div className="text-xs text-neutral-400">
                                Upload pose, face, product, styling, or scene images just for the end frame prompt.
                              </div>
                            </div>
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 transition-colors hover:border-orange-500/50 hover:text-orange-300">
                              <Upload className="h-4 w-4" />
                              Upload refs
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(event) => handleFrameReferenceUpload(scene.scene_number, 'end', event)}
                              />
                            </label>
                          </div>

                          {endReferences.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                              {endReferences.map((image) => (
                                <div
                                  key={image.id}
                                  className="group relative w-24 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900"
                                >
                                  <div className="aspect-square overflow-hidden">
                                    <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                                  </div>
                                  <div className="truncate border-t border-neutral-800 px-2 py-1 text-[11px] text-neutral-400">
                                    {image.name}
                                  </div>
                                  <button
                                    onClick={() => removeFrameReferenceImage(scene.scene_number, 'end', image.id)}
                                    className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-5 text-sm text-neutral-500">
                              No end-frame references yet. Add images if you want Gemini to follow a specific look.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row">
                          <input
                            type="text"
                            value={adjustInputs[endKey] || ''}
                            onChange={(event) => {
                              const nextValue = event.currentTarget.value;
                              setAdjustInputs((prev) => ({
                                ...prev,
                                [endKey]: nextValue,
                              }));
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                handlePromptAdjust(scene.scene_number, 'end', {
                                  prompt: scene.nano_banana_pro_prompts.end_frame,
                                  prompt_zh: scene.nano_banana_pro_prompts.end_frame_zh,
                                });
                              }
                            }}
                            disabled={adjusting[endKey]}
                            placeholder={`Tell Gemini how to refine scene ${scene.scene_number} end frame.`}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 disabled:opacity-50"
                          />
                          <button
                            onClick={() =>
                              handlePromptAdjust(scene.scene_number, 'end', {
                                prompt: scene.nano_banana_pro_prompts.end_frame,
                                prompt_zh: scene.nano_banana_pro_prompts.end_frame_zh,
                              })
                            }
                            disabled={adjusting[endKey] || !adjustInputs[endKey]?.trim()}
                            className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {adjusting[endKey] ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Adjusting...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4" />
                                AI adjust end
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 hidden rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-orange-300">
                      <Sparkles className="h-4 w-4" />
                      可直接編輯上方提示詞，也可以上傳人物姿勢、人物長相、產品圖等參考圖，讓 AI 一起協助微調。
                    </div>

                    <div className="mb-4 rounded-xl border border-neutral-800/60 bg-black/20 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-neutral-200">AI 微調參考圖</div>
                          <div className="text-xs text-neutral-400">
                            這些圖片只會用在「AI 協助微調」提示詞，不會自動覆蓋你已生成的首尾幀。
                          </div>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 transition-colors hover:border-orange-500/50 hover:text-orange-300">
                          <Upload className="h-4 w-4" />
                          上傳參考圖
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(event) => handleFrameReferenceUpload(scene.scene_number, 'start', event)}
                          />
                        </label>
                      </div>

                      {uploadedReferences.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {uploadedReferences.map((image) => (
                            <div
                              key={image.id}
                              className="group relative w-24 overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900"
                            >
                              <div className="aspect-square overflow-hidden">
                                <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
                              </div>
                              <div className="truncate border-t border-neutral-800 px-2 py-1 text-[11px] text-neutral-400">
                                {image.name}
                              </div>
                              <button
                                onClick={() => removeFrameReferenceImage(scene.scene_number, 'start', image.id)}
                                className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-neutral-800 px-4 py-5 text-sm text-neutral-500">
                          還沒有上傳參考圖。你可以放產品包裝、人臉風格、人物姿勢、服裝或場景參考，讓 AI 更懂你想要的方向。
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        type="text"
                        value={adjustInputs[scene.scene_number] || ''}
                        onChange={(event) => {
                          const nextValue = event.currentTarget.value;
                          setAdjustInputs((prev) => ({
                            ...prev,
                            [scene.scene_number]: nextValue,
                          }));
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            handlePromptAdjust(scene.scene_number, 'start', {
                              prompt: scene.nano_banana_pro_prompts.start_frame,
                              prompt_zh: scene.nano_banana_pro_prompts.start_frame_zh,
                            });
                          }
                        }}
                        disabled={adjusting[scene.scene_number]}
                        placeholder={`例如：請參考我上傳的人物姿勢與產品圖，把分鏡 ${scene.scene_number} 改成 medium close-up，保留背景空間感`}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-orange-500/50 disabled:opacity-50"
                      />
                      <button
                        onClick={() =>
                          handlePromptAdjust(scene.scene_number, 'start', {
                            prompt: scene.nano_banana_pro_prompts.start_frame,
                            prompt_zh: scene.nano_banana_pro_prompts.start_frame_zh,
                          })
                        }
                        disabled={adjusting[scene.scene_number] || !adjustInputs[scene.scene_number]?.trim()}
                        className="flex min-w-40 items-center justify-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {adjusting[scene.scene_number] ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            微調中
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            AI 協助微調
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <MediaPreviewModal
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        src={previewImage?.src || null}
        mediaType="image"
        title={previewImage?.title}
      />
    </div>
  );
}
