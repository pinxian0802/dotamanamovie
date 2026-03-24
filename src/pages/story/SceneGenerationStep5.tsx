import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { ImageIcon, Loader2, Save, RefreshCw, Upload, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { generateScenePrompts as generateScenePromptsApi, generateImage as generateImageApi } from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';

export default function SceneGenerationStep5() {
  const navigate = useNavigate();
  const { storyData, scenePrompts, setScenePrompts, sceneImages, setSceneImage, setCurrentStep, markStepCompleted } = useProjectStore();
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [sceneReferences, setSceneReferences] = useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentStep(5);

    if (storyData && scenePrompts.length === 0) {
      generateScenePrompts();
    }
  }, []);

  const generateScenePrompts = async () => {
    setIsGeneratingPrompts(true);
    try {
      const prompts = await generateScenePromptsApi(storyData);
      setScenePrompts(prompts);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else {
        alert('生成場景提示詞失敗，請重試。');
      }
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSceneReferences(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const generateImage = async (sceneNumber: string, prompt: string) => {
    setLoadingStates((prev) => ({ ...prev, [sceneNumber]: true }));
    try {
      const finalPrompt = sceneReferences.length > 0 
        ? `${prompt}, in the style of the provided reference image` 
        : prompt;

      const imageUrl = await generateImageApi(
        finalPrompt,
        '16:9',
        sceneReferences[0] || undefined
      );

      setSceneImage(sceneNumber, imageUrl);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else {
        alert(`生成場景 ${sceneNumber} 的圖片失敗，請重試。`);
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const handleSaveAndNext = () => {
    markStepCompleted(5);
    setCurrentStep(6);
    navigate('/step6');
  };

  const allGenerated = scenePrompts.length > 0 && scenePrompts.every((scene) => sceneImages[scene.sceneNumber]);

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div>
          <h2 className="text-xl font-semibold text-white">5. 分鏡圖場景製作</h2>
          <p className="text-sm text-neutral-400">將動態分鏡腳本轉化為靜態場景構圖</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={generateScenePrompts}
            disabled={isGeneratingPrompts}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", isGeneratingPrompts && "animate-spin")} />
            重新生成提示詞
          </button>
          <button
            onClick={handleSaveAndNext}
            disabled={!allGenerated}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            確認並進入下一步
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
        
        {/* Style Reference Section */}
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-2xl p-6 max-w-5xl mx-auto w-full">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            場景參考圖上傳 (Style Reference)
          </h3>
          <div className="flex items-stretch gap-6">
            <div className="flex-1 flex flex-col">
              <p className="text-sm text-neutral-400 mb-4">
                上傳場景參考圖片，系統將以此風格作為所有場景生成的基準。
              </p>
              <button 
                onClick={handleUploadClick}
                className="flex-1 flex items-center justify-center w-full min-h-[8rem] px-4 transition bg-neutral-900 border-2 border-neutral-700 border-dashed rounded-xl appearance-none cursor-pointer hover:border-indigo-500/50 focus:outline-none"
              >
                <span className="flex items-center space-x-2">
                  <Upload className="w-6 h-6 text-neutral-500" />
                  <span className="font-medium text-neutral-500">
                    點擊上傳參考圖 (PNG/JPG)
                  </span>
                </span>
              </button>
              <input type="file" name="file_upload" className="hidden" accept="image/*" multiple ref={fileInputRef} onChange={handleImageUpload} />
            </div>
            {sceneReferences.length > 0 && (
              <div className="flex gap-4 shrink-0 overflow-x-auto pt-9">
                {sceneReferences.map((ref, idx) => (
                  <div key={idx} className="flex flex-col gap-2 h-full">
                    <span className="text-xs font-medium text-neutral-400 text-center">Image {idx + 1}</span>
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-neutral-700 shrink-0 relative group">
                      <img src={ref} alt={`Scene Reference ${idx + 1}`} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setSceneReferences(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium"
                      >
                        移除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Scene Generation Section */}
        {isGeneratingPrompts ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
            <p className="text-lg">AI 正在分析分鏡並生成場景提示詞...</p>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto w-full space-y-6">
            {scenePrompts.map((scene) => {
              const isLoading = loadingStates[scene.sceneNumber];
              const imageUrl = sceneImages[scene.sceneNumber];

              return (
                <div key={scene.sceneNumber} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
                  {/* Left: Prompt Info */}
                  <div className="w-full lg:w-1/3 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg font-bold text-sm">
                        {scene.sceneNumber}
                      </div>
                      <h3 className="text-lg font-bold text-white truncate">場景設定</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">描述</h4>
                        <p className="text-neutral-200 text-sm leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50">
                          {scene.description}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">英文提示詞 (Prompt)</h4>
                        <p className="text-indigo-300 font-mono text-xs leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800 break-words">
                          {scene.englishPrompt}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Image Generation */}
                  <div className="w-full lg:w-2/3 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white invisible">Image</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadAsset(imageUrl, `scene_${scene.sceneNumber}.jpg`)}
                          disabled={!imageUrl}
                          className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                          title="下載圖片"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => generateImage(scene.sceneNumber, scene.englishPrompt)}
                          disabled={isLoading}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                          生成場景圖
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 aspect-video rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 relative flex items-center justify-center">
                      {isLoading ? (
                        <div className="flex flex-col items-center gap-4 text-indigo-400">
                          <Loader2 className="w-10 h-10 animate-spin" />
                          <span className="font-medium">生成場景中...</span>
                        </div>
                      ) : imageUrl ? (
                        <img src={imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-neutral-600 flex flex-col items-center gap-3">
                          <ImageIcon className="w-12 h-12 opacity-50" />
                          <p className="text-sm">點擊右上角按鈕開始生成</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
