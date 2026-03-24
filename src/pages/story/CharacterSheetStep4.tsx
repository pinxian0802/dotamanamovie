import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { ImageIcon, Loader2, Save, RefreshCw, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { generateImage as generateImageApi } from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';

export default function CharacterSheetStep4() {
  const navigate = useNavigate();
  const { characterPrompts, characterImages, characterConceptSheets, setCharacterConceptSheet, setCurrentStep, markStepCompleted } = useProjectStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentStep(4);
  }, []);

  const generateConceptSheet = async (name: string, baseImage: string) => {
    setLoadingStates((prev) => ({ ...prev, [name]: true }));
    try {
      const prompt = `
Character sheet with multiple angles and various facial expressions, white background.
請依據我提供的圖片生成一張半身角色概念圖，包含四種不同的表情，以 2x2 格狀拼貼，白色背景，不要裁切到角色的頭部。
請依據我提供的圖片生成一張全身角色概念圖，四個不同的動態姿勢與角度，水平並排在同一張圖中，白色背景。
`;

      const imageUrl = await generateImageApi(
        prompt,
        '16:9',
        baseImage
      );

      setCharacterConceptSheet(name, imageUrl);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else {
        alert(`生成 ${name} 的概念圖失敗，請重試。`);
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSaveAndNext = () => {
    markStepCompleted(4);
    setCurrentStep(5);
    navigate('/step5');
  };

  const allGenerated = characterPrompts.every((char) => characterConceptSheets[char.name]);

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div>
          <h2 className="text-xl font-semibold text-white">4. 生成角色概念圖</h2>
          <p className="text-sm text-neutral-400">基於角色外觀，生成多角度與表情設定圖</p>
        </div>
        <div className="flex items-center gap-4">
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
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {characterPrompts.map((char) => {
            const baseImage = characterImages[char.name];
            const sheetImage = characterConceptSheets[char.name];
            const isLoading = loadingStates[char.name];

            if (!baseImage) return null;

            return (
              <div key={char.name} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 flex flex-col lg:flex-row gap-8">
                {/* Left: Base Image */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{char.name}</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-neutral-700 text-neutral-300 rounded uppercase tracking-wider">
                      基礎外觀
                    </span>
                  </div>
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900">
                    <img src={baseImage} alt={char.name} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Right: Concept Sheet */}
                <div className="w-full lg:w-2/3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white invisible">角色設定表</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadAsset(sheetImage, `${char.name}_sheet.jpg`)}
                        disabled={!sheetImage}
                        className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-medium transition-colors disabled:opacity-50"
                        title="下載圖片"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateConceptSheet(char.name, baseImage)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                        生成概念圖 (Nano Banana Pro)
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-[400px] rounded-xl overflow-hidden border border-neutral-700 bg-neutral-900 relative flex items-center justify-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-4 text-indigo-400">
                        <Loader2 className="w-10 h-10 animate-spin" />
                        <span className="font-medium">生成多角度與表情中...</span>
                      </div>
                    ) : sheetImage ? (
                      <img src={sheetImage} alt={`${char.name} 角色設定表`} className="w-full h-full object-contain" />
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
      </div>
    </div>
  );
}
