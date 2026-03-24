import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { Bot, Loader2, Save, RefreshCw, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { generateCharacterPrompts } from '../../services/geminiService';

export default function CharacterConceptStep2() {
  const navigate = useNavigate();
  const { storyData, characterPrompts, setCharacterPrompts, setCurrentStep, markStepCompleted } = useProjectStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentStep(2);

    if (storyData && characterPrompts.length === 0) {
      generatePrompts();
    }
  }, []);

  const generatePrompts = async () => {
    setIsLoading(true);
    try {
      const prompts = await generateCharacterPrompts(storyData);
      setCharacterPrompts(prompts);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        alert('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else {
        alert('生成角色提示詞失敗，請重試。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndNext = () => {
    markStepCompleted(2);
    setCurrentStep(3);
    navigate('/step3');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div>
          <h2 className="text-xl font-semibold text-white">2. 角色概念設計</h2>
          <p className="text-sm text-neutral-400">AI 自動分析故事並生成角色提示詞</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={generatePrompts}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
            重新生成
          </button>
          <button
            onClick={handleSaveAndNext}
            disabled={characterPrompts.length === 0 || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            確認並進入下一步
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-neutral-400">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="text-lg">AI 正在分析故事並設計角色外觀...</p>
          </div>
        ) : characterPrompts.length > 0 ? (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {characterPrompts.map((char, idx) => (
                <div key={idx} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                      {char.name.charAt(0)}
                    </div>
                    <h3 className="text-xl font-bold text-white">{char.name}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">角色設定</h4>
                      <p className="text-neutral-200 text-sm leading-relaxed bg-neutral-900/50 p-3 rounded-lg border border-neutral-700/50">
                        {char.description}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">英文提示詞 (Prompt)</h4>
                      <div className="relative group">
                        <p className="text-indigo-300 font-mono text-xs leading-relaxed bg-neutral-950 p-4 rounded-lg border border-neutral-800 wrap-break-word">
                          {char.englishPrompt}
                        </p>
                        <button 
                          onClick={() => navigator.clipboard.writeText(char.englishPrompt)}
                          className="absolute top-2 right-2 p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <Bot className="w-16 h-16 mb-4 opacity-50" />
            <p>點擊右上角「重新生成」開始設計角色</p>
          </div>
        )}
      </div>
    </div>
  );
}
