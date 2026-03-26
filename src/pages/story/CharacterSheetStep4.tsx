import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, Loader2, Save, RefreshCw, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { useProjectStore } from '../../store/useProjectStore';
import { generateImage as generateImageApi } from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';
import MediaPreviewModal from '../../components/MediaPreviewModal';

export default function CharacterSheetStep4() {
  const navigate = useNavigate();
  const {
    characterPrompts,
    characterImages,
    characterConceptSheets,
    setCharacterConceptSheet,
    setCurrentStep,
    markStepCompleted,
  } = useProjectStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string } | null>(null);

  useEffect(() => {
    setCurrentStep(4);
  }, []);

  const generateConceptSheet = async (name: string, baseImage: string) => {
    setLoadingStates((prev) => ({ ...prev, [name]: true }));

    try {
      const prompt = `
Character sheet with multiple angles and various facial expressions, white background.
Create a clean 2x2 concept sheet that keeps the same character identity, costume language, colors, and face proportions.
`;

      const imageUrl = await generateImageApi(prompt, '16:9', baseImage);
      setCharacterConceptSheet(name, imageUrl);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額不足，請稍後再試。');
      } else {
        alert(`${name} 的角色設定表生成失敗，請稍後再試。`);
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
    <div className="flex h-full flex-col bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/50 p-4">
        <div>
          <h2 className="text-xl font-semibold text-white">4. 角色多視角設定表</h2>
          <p className="text-sm text-neutral-400">為角色生成多角度與表情設定，方便後續保持一致性</p>
        </div>
        <button
          onClick={handleSaveAndNext}
          disabled={!allGenerated}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          確認並進入下一步
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {characterPrompts.map((char) => {
            const baseImage = characterImages[char.name];
            const sheetImage = characterConceptSheets[char.name];
            const isLoading = loadingStates[char.name];

            if (!baseImage) return null;

            return (
              <div key={char.name} className="flex flex-col gap-8 rounded-2xl border border-neutral-700 bg-neutral-800 p-6 lg:flex-row">
                <div className="flex w-full flex-col gap-4 lg:w-1/3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">{char.name}</h3>
                    <span className="rounded bg-neutral-700 px-2 py-1 text-xs font-medium uppercase tracking-wider text-neutral-300">
                      角色基準圖
                    </span>
                  </div>
                  <div className="aspect-[3/4] overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
                    <button
                      onClick={() => setPreviewImage({ src: baseImage, title: `${char.name} 角色基準圖` })}
                      className="h-full w-full"
                    >
                      <img src={baseImage} alt={char.name} className="h-full w-full object-cover" />
                    </button>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-4 lg:w-2/3">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-white">角色設定表</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadAsset(sheetImage, `${char.name}_sheet.jpg`)}
                        disabled={!sheetImage}
                        className="flex items-center gap-2 rounded-lg bg-neutral-800 px-3 py-2 font-medium text-neutral-300 transition-colors hover:bg-neutral-700 disabled:opacity-50"
                        title="下載圖片"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => generateConceptSheet(char.name, baseImage)}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600/20 px-4 py-2 font-medium text-indigo-400 transition-colors hover:bg-indigo-600/30 disabled:opacity-50"
                      >
                        <RefreshCw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
                        生成設定表
                      </button>
                    </div>
                  </div>

                  <div className="relative flex min-h-[400px] flex-1 items-center justify-center overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-4 text-indigo-400">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <span className="font-medium">正在生成角色設定表...</span>
                      </div>
                    ) : sheetImage ? (
                      <button
                        onClick={() => setPreviewImage({ src: sheetImage, title: `${char.name} 角色設定表` })}
                        className="h-full w-full"
                      >
                        <img src={sheetImage} alt={`${char.name} 角色設定表`} className="h-full w-full object-contain" />
                      </button>
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-neutral-600">
                        <ImageIcon className="h-12 w-12 opacity-50" />
                        <p className="text-sm">尚未生成角色設定表</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
