import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { Image as ImageIcon, Loader2, Save, Upload, RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { generateImage as generateImageApi } from '../../services/geminiService';
import { downloadAsset } from '../../utils/download';

export default function CharacterDesignStep3() {
  const navigate = useNavigate();
  const {
    characterPrompts,
    characterImages,
    characterDesignConfirmed,
    setCharacterImage,
    setCharacterDesignConfirmed,
    setCurrentStep,
    markStepCompleted,
  } = useProjectStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [styleReferences, setStyleReferences] = useState<string[]>([]);
  const [styleTextDescription, setStyleTextDescription] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentStep(3);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setStyleReferences(prev => [...prev, reader.result as string]);
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

  const generateImage = async (name: string, prompt: string) => {
    setLoadingStates((prev) => ({ ...prev, [name]: true }));
    try {
      // Append style reference instructions if any
      let finalPrompt = prompt;
      if (styleReferences.length > 0) {
        finalPrompt += `, in the style of the provided reference image`;
      }
      if (styleTextDescription) {
        finalPrompt = `[Style: ${styleTextDescription}] ` + finalPrompt;
      }

      const imageUrl = await generateImageApi(
        finalPrompt,
        '3:4',
        styleReferences[0] || undefined
      );

      setCharacterImage(name, imageUrl);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else {
        alert(`生成 ${name} 的圖片失敗，請重試。`);
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [name]: false }));
    }
  };

  const toggleFinalize = (name: string) => {
    if (!characterImages[name]) return; // Only allow finalize if image exists
    setCharacterDesignConfirmed(name, !characterDesignConfirmed[name]);
  };

  const handleSaveAndNext = () => {
    markStepCompleted(3);
    setCurrentStep(4);
    navigate('/step4');
  };

  const allGenerated = characterPrompts.every((char) => characterImages[char.name]);
  const allFinalized = characterPrompts.every((char) => characterDesignConfirmed[char.name]);
  const canProceed = allGenerated && allFinalized;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div>
          <h2 className="text-xl font-semibold text-white">3. 角色設計</h2>
          <p className="text-sm text-neutral-400">確定視覺風格並生成角色基礎外觀</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSaveAndNext}
            disabled={!canProceed}
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
            全域視覺風格定調 (Style Reference)
          </h3>
          <div className="flex flex-col gap-6">
            <div className="flex items-stretch gap-6">
              <div className="flex-1 flex flex-col">
                <p className="text-sm text-neutral-400 mb-4">
                  上傳參考圖片，系統將以此風格作為所有角色生成的基準。若不上傳，將由 AI 自由發揮。
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
              {styleReferences.length > 0 && (
                <div className="flex gap-4 shrink-0 overflow-x-auto pt-9">
                  {styleReferences.map((ref, idx) => (
                    <div key={idx} className="flex flex-col gap-2 h-full">
                      <span className="text-xs font-medium text-neutral-400 text-center">Image {idx + 1}</span>
                      <div className="w-32 h-32 rounded-xl overflow-hidden border border-neutral-700 shrink-0 relative group">
                        <img src={ref} alt={`Style Reference ${idx + 1}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setStyleReferences(prev => prev.filter((_, i) => i !== idx))}
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
            
            <div className="flex-1">
              <p className="text-sm text-neutral-400 mb-2">
                或者，您也可以使用文字描述想要的風格（例如：日系動畫、賽博龐克、水彩畫風等）：
              </p>
              <textarea
                value={styleTextDescription}
                onChange={(e) => setStyleTextDescription(e.target.value)}
                placeholder="輸入風格描述..."
                className="w-full h-24 p-3 bg-neutral-900 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Character Generation Section */}
        <div className="max-w-5xl mx-auto w-full">
          <h3 className="text-lg font-semibold text-white mb-6">角色生成清單</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characterPrompts.map((char) => {
              const isLoading = loadingStates[char.name];
              const imageUrl = characterImages[char.name];
              const isFinalized = characterDesignConfirmed[char.name];

              return (
                <div key={char.name} className={clsx(
                  "bg-neutral-800 border rounded-2xl overflow-hidden flex flex-col transition-all",
                  isFinalized ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-neutral-700"
                )}>
                  <div className="p-4 border-b border-neutral-700 flex justify-between items-center bg-neutral-900/50">
                    <h4 className="font-bold text-white truncate pr-2">{char.name}</h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => downloadAsset(imageUrl, `${char.name}_design.jpg`)}
                        disabled={!imageUrl}
                        className="p-2 bg-neutral-700/50 text-neutral-400 hover:bg-neutral-600/50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        title="下載圖片"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => generateImage(char.name, char.englishPrompt)}
                        disabled={isLoading || isFinalized}
                        className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                        title="生成圖片"
                      >
                        <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                      </button>
                      <button
                        onClick={() => toggleFinalize(char.name)}
                        disabled={!imageUrl || isLoading}
                        className={clsx(
                          "p-2 rounded-lg transition-colors disabled:opacity-50 shrink-0",
                          isFinalized 
                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" 
                            : "bg-neutral-700/50 text-neutral-400 hover:bg-neutral-600/50"
                        )}
                        title={isFinalized ? "取消定案" : "設為定案"}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-4 flex flex-col gap-4">
                    <div className="aspect-[3/4] w-full bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden relative flex items-center justify-center">
                      {isLoading ? (
                        <div className="flex flex-col items-center gap-3 text-indigo-400">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-sm font-medium">生成中...</span>
                        </div>
                      ) : imageUrl ? (
                        <img src={imageUrl} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-neutral-600 flex flex-col items-center gap-2">
                          <ImageIcon className="w-8 h-8 opacity-50" />
                          <span className="text-sm">等待生成</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-neutral-500 line-clamp-3 font-mono leading-relaxed bg-neutral-950 p-2 rounded border border-neutral-800/50">
                      {char.englishPrompt}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
