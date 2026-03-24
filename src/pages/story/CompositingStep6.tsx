import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { ImageIcon, Loader2, Save, RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { downloadAsset } from '../../utils/download';
import { generateImage as generateImageApi } from '../../services/geminiService';

export default function CompositingStep6() {
  const navigate = useNavigate();
  const { scenePrompts, sceneImages, characterImages, compositedScenes, setCompositedScene, setCurrentStep, markStepCompleted } = useProjectStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentStep(6);
  }, []);

  const compositeScene = async (sceneNumber: string, sceneImage: string, characterImage: string) => {
    setLoadingStates((prev) => ({ ...prev, [sceneNumber]: true }));
    try {
      // In a real implementation with Nano Banana Pro, we would send both images and a mask.
      // Here we simulate it by calling the image generation API with a compositing prompt
      // and passing the scene image as reference.
      const prompt = `Composite a character naturally blending into the background lighting of this scene.`;

      const imageUrl = await generateImageApi(prompt, '16:9', sceneImage);
      
      setCompositedScene(sceneNumber, imageUrl);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else {
        alert(`合成場景 ${sceneNumber} 失敗，請重試。`);
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const handleNext = () => {
    markStepCompleted(6);
    navigate('/step7');
  };

  const allGenerated = scenePrompts.length > 0 && scenePrompts.every((scene) => compositedScenes[scene.sceneNumber]);

  // Get the first character image to use as a dummy for compositing if needed
  const firstCharacterImage = Object.values(characterImages)[0];

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div>
          <h2 className="text-xl font-semibold text-white">6. 分鏡圖人物與場景製作</h2>
          <p className="text-sm text-neutral-400">角色與場景的最終合成 (Compositing)</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNext}
            disabled={!allGenerated}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            儲存並進入下一步
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {scenePrompts.map((scene) => {
            const sceneImage = sceneImages[scene.sceneNumber];
            const compositedImage = compositedScenes[scene.sceneNumber];
            const isLoading = loadingStates[scene.sceneNumber];

            if (!sceneImage) return null;

            return (
              <div key={scene.sceneNumber} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 flex flex-col lg:flex-row gap-8">
                {/* Left: Source Images */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg font-bold text-sm">
                      {scene.sceneNumber}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-neutral-700 text-neutral-300 rounded uppercase tracking-wider">
                      素材
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-neutral-400 mb-2">場景底圖</p>
                      <div className="aspect-video rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900">
                        <img src={sceneImage} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    {firstCharacterImage && (
                      <div>
                        <p className="text-xs text-neutral-400 mb-2">角色素材 (示意)</p>
                        <div className="w-24 aspect-[3/4] rounded-lg overflow-hidden border border-neutral-700 bg-neutral-900">
                          <img src={firstCharacterImage} alt="Character" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Composited Result */}
                <div className="w-full lg:w-2/3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white invisible">Composited</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadAsset(compositedImage, `composited_${scene.sceneNumber}.jpg`)}
                        disabled={!compositedImage}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                        title="下載圖片"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => compositeScene(scene.sceneNumber, sceneImage, firstCharacterImage)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                        合成影像 (Nano Banana Pro)
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[300px] aspect-video rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 relative flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-4 text-indigo-400">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <span className="font-medium">AI 正在進行影像合成...</span>
                      </div>
                    ) : compositedImage ? (
                      <img src={compositedImage} alt={`Composited ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-neutral-600 flex flex-col items-center gap-3">
                        <ImageIcon className="w-12 h-12 opacity-50" />
                        <p className="text-sm">點擊右上角按鈕開始合成</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
