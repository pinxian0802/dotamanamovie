import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { adjustPromoScriptData, generatePromoScriptData } from '../../services/geminiService';
import { Sparkles, ArrowRight, Loader2, Package, FileText, Paperclip, X, AlertTriangle } from 'lucide-react';
import { DataMatrixLoader } from '../../components/DataMatrixLoader';
import { clsx } from 'clsx';

export default function PromoScriptStep2() {
  const navigate = useNavigate();
  const { setPromoScriptData, markStepCompleted, setCurrentStep, promoScriptData, name, description, workflowType } = useProjectStore();
  
  const [productName, setProductName] = useState('');
  const [productFeatures, setProductFeatures] = useState('');
  const [productContents, setProductContents] = useState('');
  const [productOrigin, setProductOrigin] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [includeCharacters, setIncludeCharacters] = useState(false);
  const [supplementaryText, setSupplementaryText] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<{ mimeType: string; data: string; name: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || !promoScriptData) return;
    
    const newUserMessage = { role: 'user' as const, text: chatInput };
    const newHistory = [...chatHistory, newUserMessage];
    setChatHistory(newHistory);
    setChatInput('');
    setIsGenerating(true);

    try {
      const data = await adjustPromoScriptData(promoScriptData, chatInput);
      setPromoScriptData(data);
      setChatHistory([...newHistory, { role: 'model', text: '已根據您的需求調整腳本與分鏡。' }]);
    } catch (error) {
      console.error(error);
      setChatHistory([...newHistory, { role: 'model', text: '調整失敗，請稍後再試。' }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setReferenceFiles(prev => [...prev, {
          mimeType: file.type,
          data: base64String,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!productName || !productFeatures) return;
    
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const data = await generatePromoScriptData({
        productName,
        productFeatures,
        productContents,
        productOrigin,
        aspectRatio,
        includeCharacters,
        supplementaryText,
        referenceFiles,
      });

      setPromoScriptData(data);
    } catch (error: any) {
      console.error('Failed to generate script:', error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('Safety') || errorString.includes('400')) {
        setErrorMsg('提示詞觸發安全審查，請修改產品名稱、功效或補充說明後再試。');
      } else if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('模型目前處於高負載狀態，請稍後再試。');
      } else {
        setErrorMsg('生成失敗，請稍後再試或檢查 API 設定。');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNext = () => {
    markStepCompleted(1);
    setCurrentStep(2);
    navigate('/step3a');
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-wide">1. 產品解構與腳本大綱</h2>
          <p className="text-sm text-orange-400/80 font-mono">PROMO.INIT // 產品資料矩陣與腳本生成</p>
        </div>
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
        {/* Left: Product Data Matrix */}
        <div className="w-full md:w-1/3 border-r border-neutral-800/50 bg-neutral-900/30 p-6 overflow-y-auto flex flex-col gap-6">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Package className="w-5 h-5" />
            <h3 className="font-semibold">產品資料矩陣</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">產品名稱</label>
              <input 
                type="text" 
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                placeholder="例如：極光保濕精華"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">核心功能 / 賣點</label>
              <textarea 
                value={productFeatures}
                onChange={(e) => setProductFeatures(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50 h-24 resize-none"
                placeholder="例如：深層補水、提亮膚色、24小時鎖水"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">內容物 / 成分 (選填)</label>
              <input 
                type="text" 
                value={productContents}
                onChange={(e) => setProductContents(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                placeholder="例如：玻尿酸、維他命C"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">產地 / 品牌背景 (選填)</label>
              <input 
                type="text" 
                value={productOrigin}
                onChange={(e) => setProductOrigin(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                placeholder="例如：日本製造"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1">影片比例</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
              >
                <option value="9:16">9:16 (直式短影音)</option>
                <option value="16:9">16:9 (橫式影片)</option>
                <option value="1:1">1:1 (正方形影片)</option>
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeCharacters}
                  onChange={(e) => setIncludeCharacters(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-700 text-orange-500 focus:ring-orange-500/50 bg-neutral-950"
                />
                <span className="text-sm font-medium text-neutral-400">需要人物出鏡</span>
              </label>
            </div>

            {/* Supplementary Input */}
            <div className="pt-4 border-t border-neutral-800/50">
              <label className="block text-sm font-medium text-neutral-400 mb-1">補充說明 (風格、元素等)</label>
              <textarea 
                value={supplementaryText}
                onChange={(e) => setSupplementaryText(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50 h-20 resize-none mb-3"
                placeholder="例如：希望是賽博龐克風格、要有霓虹燈元素..."
              />
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-sm cursor-pointer transition-colors border border-neutral-700">
                    <Paperclip className="w-4 h-4" />
                    上傳參考圖片/影片
                    <input 
                      type="file" 
                      accept="image/*,video/mp4,video/webm" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                
                {referenceFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {referenceFiles.map((file, idx) => (
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
            disabled={isGenerating || !productName || !productFeatures}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors border border-neutral-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成腳本中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-orange-400" />
                生成廣告腳本與分鏡
              </>
            )}
          </button>
          
          {errorMsg && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Right: Dialogue & Storyboard Window */}
        <div className="w-full md:w-2/3 bg-neutral-950/50 p-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-orange-400 mb-6">
            <FileText className="w-5 h-5" />
            <h3 className="font-semibold">對話與分鏡視窗</h3>
          </div>

          {!promoScriptData && !isGenerating && (
            <div className="h-64 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              請在左側輸入產品資訊並點擊生成
            </div>
          )}

          {isGenerating && (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-400 gap-4">
              <DataMatrixLoader size="lg" text="AI 導演正在構思分鏡與腳本..." />
            </div>
          )}

          {promoScriptData && !isGenerating && (
            <div className="space-y-8">
              {/* Script Dialogue */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
                <h4 className="text-sm font-medium text-neutral-400 mb-4 uppercase tracking-wider">旁白腳本</h4>
                <div className="whitespace-pre-wrap text-lg text-neutral-200 leading-relaxed font-serif">
                  {promoScriptData.script_dialogue}
                </div>
              </div>

              {/* Storyboard */}
              <div className="space-y-6">
                <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">分鏡規劃</h4>
                {promoScriptData.storyboard.map((scene, idx) => (
                  <div key={idx} className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-lg text-sm font-mono font-bold">
                        場景 {scene.scene_number}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <div className="text-sm text-neutral-400 font-mono">首幀提示詞</div>
                        <div className="bg-black/60 p-5 rounded-xl text-base text-neutral-100 font-mono border border-neutral-700">
                          {scene.nano_banana_pro_prompts.start_frame}
                        </div>
                        <div className="text-sm text-neutral-400 mt-2 italic">{scene.nano_banana_pro_prompts.start_frame_zh}</div>
                      </div>
                      <div className="space-y-3">
                        <div className="text-sm text-neutral-400 font-mono">尾幀提示詞</div>
                        <div className="bg-black/60 p-5 rounded-xl text-base text-neutral-100 font-mono border border-neutral-700">
                          {scene.nano_banana_pro_prompts.end_frame}
                        </div>
                        <div className="text-sm text-neutral-400 mt-2 italic">{scene.nano_banana_pro_prompts.end_frame_zh}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Interface */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 space-y-4">
                <h4 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">與 AI 調整分鏡架構</h4>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={clsx("p-3 rounded-lg text-sm", msg.role === 'user' ? "bg-orange-500/10 text-orange-100 ml-auto max-w-[80%]" : "bg-neutral-800 text-neutral-300 mr-auto max-w-[80%]")}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="例如：把第二鏡頭的場景改成室內..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500/50"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={isGenerating || !chatInput.trim()}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors"
                  >
                    發送
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
