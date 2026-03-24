import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { ArrowLeft, Music, Loader2, CheckCircle2, Play, Pause, Download, RefreshCw, ListMusic, MessageSquare, Send, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { downloadAsset } from '../../utils/download';
import { DataMatrixLoader } from '../../components/DataMatrixLoader';
import { generateMusicPrompts, suggestMusicPrompts } from '../../services/geminiService';

interface SunoPrompt {
  id: string;
  style: string;
  description: string;
  prompt: string;
  reason: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface GeneratedTrack {
  id: string;
  url: string;
  title: string;
  tags: string;
  duration: string;
  thumbnail: string;
}

const CustomAudioPlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100 || 0);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(formatTime(audioRef.current.duration));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3 w-full bg-neutral-900/50 rounded-lg p-2 border border-neutral-800">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
      <button onClick={togglePlay} className="p-1.5 bg-orange-600 hover:bg-orange-500 rounded-full text-white shrink-0 transition-colors">
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>
      <span className="text-xs text-neutral-400 font-mono w-10 text-right">{currentTime}</span>
      <input
        type="range"
        min="0"
        max="100"
        value={progress}
        onChange={handleSeek}
        className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
      />
      <span className="text-xs text-neutral-400 font-mono w-10">{duration}</span>
    </div>
  );
};

export default function MusicStep() {
  const navigate = useNavigate();
  const { workflowType, promoScriptData, storyData, markStepCompleted, setCurrentStep, name, description } = useProjectStore();
  
  const [includeVocals, setIncludeVocals] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [sunoPrompts, setSunoPrompts] = useState<SunoPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<GeneratedTrack[]>([]);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGeneratePrompts = async () => {
    setIsGeneratingPrompts(true);
    setErrorMsg(null);
    setSunoPrompts([]);
    setSelectedPromptId(null);
    setGeneratedMusic([]);
    
    try {
      const data = await generateMusicPrompts({
        includeVocals,
        workflowType,
        promoScriptData,
        storyData,
      });

      setSunoPrompts(data);
    } catch (error: any) {
      console.error('Failed to generate music prompts:', error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('Safety') || errorString.includes('400')) {
        setErrorMsg('提示詞觸發安全審查，請修改腳本內容後再試。');
      } else if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setErrorMsg('API 配額已用盡，請檢查您的計費方案或稍後再試。');
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setErrorMsg('模型目前處於高負載狀態，請稍後再試。');
      } else {
        setErrorMsg('生成失敗，請稍後再試或檢查 API 設定。');
      }
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!selectedPromptId) return;
    
    setIsGeneratingMusic(true);
    
    const selectedPrompt = sunoPrompts.find(p => p.id === selectedPromptId);
    const title = selectedPrompt ? selectedPrompt.style : '生成的配樂';
    const tags = selectedPrompt ? selectedPrompt.prompt : 'Instrumental';

    // Mock Suno API generation
    // In a real app, this would call Suno API and wait for the result
    setTimeout(() => {
      setGeneratedMusic([
        {
          id: 'track_1',
          url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg',
          title: `(${title} - 版本 1)`,
          tags: tags,
          duration: '2:38',
          thumbnail: 'https://picsum.photos/seed/music1/200/200'
        },
        {
          id: 'track_2',
          url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
          title: `(${title} - 版本 2)`,
          tags: tags,
          duration: '3:11',
          thumbnail: 'https://picsum.photos/seed/music2/200/200'
        },
        {
          id: 'track_3',
          url: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
          title: `(${title} - 版本 3)`,
          tags: tags,
          duration: '4:09',
          thumbnail: 'https://picsum.photos/seed/music3/200/200'
        }
      ]);
      setIsGeneratingMusic(false);
    }, 4000);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const newUserMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatMessages(prev => [...prev, newUserMsg]);
    setChatInput('');
    setIsChatting(true);
    
    try {
      const newPrompts = await suggestMusicPrompts({
        currentPrompts: sunoPrompts,
        history: chatMessages,
        userInput: chatInput,
      });

      setChatMessages(prev => [...prev, { role: 'model', text: '已根據您的需求提供新的配樂提示詞。' }]);
      setSunoPrompts(prev => [...prev, ...newPrompts]);
      
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: 'model', text: '抱歉，發生了一些錯誤，請稍後再試。' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleBack = () => {
    if (workflowType === 'promo') {
      navigate('/step5a');
    } else {
      navigate('/step7');
    }
  };

  const handleResetToPrompts = () => {
    setGeneratedMusic([]);
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">
              {workflowType === 'promo' ? '5. 影片配樂' : '8. 影片配樂'}
            </h2>
            <p className="text-sm text-orange-400/80 font-mono">AUDIO.GEN // AI 配樂生成</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {generatedMusic.length === 0 ? (
            <>
              {/* Step 1: Generate Prompts */}
              <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-2 text-orange-400">
                  <ListMusic className="w-5 h-5" />
                  <h3 className="font-semibold">第一步：生成配樂提示詞</h3>
                </div>
                
                <div className="flex items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeVocals}
                      onChange={(e) => setIncludeVocals(e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-700 text-orange-500 focus:ring-orange-500/50 bg-neutral-900"
                    />
                    <span className="text-neutral-300 font-medium">需要人聲 (Include Vocals)</span>
                  </label>
                  
                  <button
                    onClick={handleGeneratePrompts}
                    disabled={isGeneratingPrompts}
                    className="flex items-center gap-2 px-6 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors border border-neutral-700"
                  >
                    {isGeneratingPrompts ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        分析腳本中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {sunoPrompts.length > 0 ? '重新生成提示詞' : '生成 5 款配樂提示詞'}
                      </>
                    )}
                  </button>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                {/* Prompts List */}
                {sunoPrompts.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 gap-4 mt-6">
                    {sunoPrompts.map((prompt) => (
                      <div 
                        key={prompt.id}
                        onClick={() => setSelectedPromptId(prompt.id)}
                        className={clsx(
                          "p-4 rounded-xl border cursor-pointer transition-all",
                          selectedPromptId === prompt.id 
                            ? "bg-orange-500/10 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                            : "bg-neutral-950 border-neutral-800 hover:border-neutral-700"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {selectedPromptId === prompt.id && <CheckCircle2 className="w-5 h-5 text-orange-500" />}
                              <h4 className="font-semibold text-white">{prompt.style}</h4>
                            </div>
                            <p className="text-sm text-neutral-400">{prompt.description}</p>
                            <div className="bg-black/50 p-3 rounded-lg text-xs text-neutral-500 font-mono mt-2">
                              {prompt.prompt}
                            </div>
                            {prompt.reason && (
                              <div className="mt-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                <p className="text-sm text-indigo-300 font-medium mb-1">推薦原因：</p>
                                <p className="text-sm text-indigo-200/80">{prompt.reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* AI Chat Interface */}
                  <div className="mt-8 bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4 text-indigo-400">
                      <MessageSquare className="w-5 h-5" />
                      <h3 className="font-semibold">與 AI 討論調整提示詞</h3>
                    </div>
                    
                    <div className="space-y-4 mb-4 max-h-75 overflow-y-auto pr-2">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-neutral-500 py-4 text-sm">
                          如果對上面的提示詞不滿意，可以告訴我您想要的風格、節奏或樂器，我會為您重新生成。
                        </div>
                      ) : (
                        chatMessages.map((msg, idx) => (
                          <div key={idx} className={clsx(
                            "flex flex-col max-w-[80%] rounded-xl p-3 text-sm",
                            msg.role === 'user' 
                              ? "bg-indigo-600/20 text-indigo-100 ml-auto rounded-tr-sm" 
                              : "bg-neutral-800 text-neutral-200 mr-auto rounded-tl-sm"
                          )}>
                            <div className="whitespace-pre-wrap">
                              {msg.text.replace(/```json\n[\s\S]*?\n```/g, '\n[已為您生成新的提示詞，請查看上方列表]')}
                            </div>
                          </div>
                        ))
                      )}
                      {isChatting && (
                        <div className="flex items-center gap-2 text-neutral-500 text-sm mr-auto bg-neutral-800 rounded-xl rounded-tl-sm p-3">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          AI 思考中...
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="例如：我想要更輕快一點、加入吉他聲..."
                        className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/50"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={isChatting || !chatInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shrink-0"
                      >
                        <Send className="w-4 h-4" />
                        發送
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

              {/* Step 2: Generate Music */}
              {sunoPrompts.length > 0 && (
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
                  <div className="text-neutral-400">
                    {selectedPromptId ? '已選擇配樂風格，準備生成音樂' : '請在上方選擇一款喜歡的配樂風格'}
                  </div>
                  <button
                    onClick={handleGenerateMusic}
                    disabled={!selectedPromptId || isGeneratingMusic}
                    className="flex items-center gap-2 px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-orange-900/20"
                  >
                    {isGeneratingMusic ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Suno 生成中...
                      </>
                    ) : (
                      <>
                        <Music className="w-5 h-5" />
                        生成 3 款配樂
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {isGeneratingMusic && (
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-12 flex items-center justify-center">
                  <DataMatrixLoader text="GENERATING AUDIO TRACKS..." />
                </div>
              )}
            </>
          ) : (
            /* Step 3: Music Results */
            <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-orange-400">
                  <Music className="w-5 h-5" />
                  <h3 className="font-semibold">生成的配樂結果</h3>
                </div>
                <button
                  onClick={handleResetToPrompts}
                  className="text-sm text-neutral-400 hover:text-white transition-colors underline underline-offset-4"
                >
                  不滿意？回上一步重新選擇風格
                </button>
              </div>
              
              <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg mb-6">
                <p className="text-sm text-orange-400 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>系統提示：</strong> 字體與品牌 Logo 需於輸出後透過剪輯軟體疊加，以確保品牌識別不變形。
                  </span>
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {generatedMusic.map((track) => (
                  <div key={track.id} className="flex gap-4 p-4 bg-neutral-950 hover:bg-neutral-900/80 rounded-xl border border-neutral-800 transition-colors group">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-neutral-800">
                      <img src={track.thumbnail} alt="縮圖" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {track.duration}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-base font-bold text-white truncate">{track.title}</h4>
                        <span className="px-1.5 py-0.5 bg-neutral-800 text-neutral-400 text-[10px] rounded border border-neutral-700 shrink-0">
                          v4.5-all
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 truncate mb-3">
                        {track.tags}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadAsset(track.url, `${track.title}.ogg`)}
                          className="flex items-center gap-2 px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md text-sm transition-colors border border-neutral-700"
                        >
                          <Download className="w-4 h-4" />
                          下載配樂
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => {
                  navigate('/archive');
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
              >
                完成並儲存至歷史專案庫
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
