import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { Send, Bot, User, Loader2, Save, Paperclip, Reply, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { generateChatResponse } from '../../services/geminiService';
import { STORY_CHAT_SYSTEM_PROMPT } from '../../config/promptTemplates';

export default function StoryStep1() {
  const navigate = useNavigate();
  const { storyChatHistory, setStoryChatHistory, setStoryData, setCurrentStep, markStepCompleted, name, setName, description, setDescription } = useProjectStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('Gemini');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [replyingTo, setReplyingTo] = useState<{ text: string, index: number } | null>(null);
  const [selectedFinalIndex, setSelectedFinalIndex] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentStep(1);
    if (storyChatHistory.length === 0) {
      // Initial greeting
      setStoryChatHistory([
        {
          role: 'model',
          text: '我們先一起把 GEM 故事動畫流的前期內容定下來。我會陪你依序完成：\n\n1. 故事大綱\n\n2. 劇本內容\n\n3. 分鏡規劃\n\n你可以直接告訴我故事概念、角色設定、情緒風格或參考作品。',
        },
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyChatHistory]);

  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isLoading) return;

    let userMessage = input.trim();
    if (replyingTo) {
      userMessage = `[回覆]: "${replyingTo.text.substring(0, 50)}..."\n\n${userMessage}`;
    }
    
    // Read files as base64
    const base64Images: string[] = [];
    if (uploadedFiles.length > 0) {
      const fileNames = uploadedFiles.map(f => f.name).join(', ');
      userMessage = `[附加檔案: ${fileNames}]\n${userMessage}`;
      
      for (const file of uploadedFiles) {
        if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          base64Images.push(base64);
        }
      }
    }

    setInput('');
    setReplyingTo(null);
    setUploadedFiles([]);
    
    const newHistory = [...storyChatHistory, { role: 'user' as const, text: userMessage, images: base64Images.length > 0 ? base64Images : undefined }];
    setStoryChatHistory(newHistory);
    setIsLoading(true);

    try {
      const responseText = await generateChatResponse(
        newHistory,
        userMessage,
        STORY_CHAT_SYSTEM_PROMPT,
        model
      );

      setStoryChatHistory([...newHistory, { role: 'model', text: responseText }]);
    } catch (error: any) {
      console.error(error);
      const errorString = error?.message || JSON.stringify(error) || '';
      if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
        setStoryChatHistory([...newHistory, { role: 'model', text: 'API 配額已用盡，請檢查您的計費方案或稍後再試。' }]);
      } else if (errorString.includes('503') || errorString.includes('UNAVAILABLE')) {
        setStoryChatHistory([...newHistory, { role: 'model', text: '模型目前處於高負載狀態，請稍後再試。' }]);
      } else {
        setStoryChatHistory([...newHistory, { role: 'model', text: '抱歉，發生了錯誤，請稍後再試。' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndNext = () => {
    if (selectedFinalIndex === null) return;
    
    const finalData = storyChatHistory[selectedFinalIndex].text;
    setStoryData(finalData);
    markStepCompleted(1);
    setCurrentStep(2);
    navigate('/step2');
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    // Reset the input value so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaperclipClick = () => {
    fileInputRef.current?.click();
  };

  const getFileLabel = (file: File, index: number) => {
    if (file.type.startsWith('image/')) return `圖片${index + 1}`;
    if (file.type.startsWith('video/')) return `影片${index + 1}`;
    if (file.type.startsWith('audio/')) return `音樂${index + 1}`;
    return `檔案${index + 1}`;
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-wide">1. 故事與概念發想</h2>
          <p className="text-sm text-indigo-400/80 font-mono">SYSTEM.INIT // 討論故事大綱、劇本與分鏡</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="專案名稱"
            className="bg-neutral-900/80 border border-neutral-700/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="專案大綱"
            className="bg-neutral-900/80 border border-neutral-700/50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select 
            value={model} 
            onChange={(e) => setModel(e.target.value)}
            className="bg-neutral-900/80 border border-neutral-700/50 text-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
          >
            <option value="Gemini">Gemini Story Planner</option>
            <option value="GPT">GPT-5 (Mock)</option>
          </select>
          <button
            onClick={handleSaveAndNext}
            disabled={selectedFinalIndex === null}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
          >
            <Save className="w-4 h-4" />
            {selectedFinalIndex !== null ? '儲存定案並進入下一步' : '請先選擇一個定案'}
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {storyChatHistory.map((msg, idx) => {
          const isSelected = selectedFinalIndex === idx;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={clsx("flex gap-4 max-w-4xl group", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}
            >
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-lg",
                msg.role === 'user' 
                  ? "bg-emerald-900/40 border-emerald-500/50 text-emerald-400 shadow-emerald-500/20" 
                  : "bg-indigo-900/40 border-indigo-500/50 text-indigo-400 shadow-indigo-500/20"
              )}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className="flex flex-col gap-2 max-w-[calc(100%-3rem)] w-full">
                {msg.role === 'user' ? (
                  <motion.div 
                    animate={{
                      boxShadow: [
                        "0 0 10px rgba(168,85,247,0.3), inset 0 0 5px rgba(59,130,246,0.3)",
                        "0 0 20px rgba(236,72,153,0.5), inset 0 0 10px rgba(168,85,247,0.5)",
                        "0 0 10px rgba(168,85,247,0.3), inset 0 0 5px rgba(59,130,246,0.3)"
                      ],
                      borderColor: [
                        "rgba(168,85,247,0.4)",
                        "rgba(236,72,153,0.7)",
                        "rgba(168,85,247,0.4)"
                      ]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className={clsx(
                      "p-5 rounded-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300 border bg-neutral-950/60 text-emerald-50",
                      isSelected && "ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
                    )}
                  >
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-3 mb-3">
                        {msg.images.map((fileDataUrl, i) => {
                          const isImage = fileDataUrl.startsWith('data:image/');
                          const isVideo = fileDataUrl.startsWith('data:video/');
                          const isAudio = fileDataUrl.startsWith('data:audio/');
                          const label = isImage ? `圖片${i + 1}` : isVideo ? `影片${i + 1}` : isAudio ? `音樂${i + 1}` : `檔案${i + 1}`;
                          return (
                          <div key={i} className="flex items-center gap-2 bg-neutral-800/80 border border-emerald-500/30 rounded-lg p-1.5 pr-3 shadow-sm">
                            <div className="w-8 h-8 shrink-0 rounded overflow-hidden bg-neutral-900 flex items-center justify-center relative">
                              {isImage ? (
                                <img src={fileDataUrl} alt={label} className="w-full h-full object-cover" />
                              ) : (
                                <Paperclip className="w-4 h-4 text-emerald-400" />
                              )}
                            </div>
                            <span className="text-xs font-medium text-emerald-300 whitespace-nowrap">{label}</span>
                          </div>
                        )})}
                      </div>
                    )}
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-950/80 prose-pre:border prose-pre:border-neutral-800/50 prose-a:text-indigo-400">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </motion.div>
                ) : (
                  <div 
                    className={clsx(
                      "py-2 px-1 transition-all duration-300",
                      isSelected && "p-5 rounded-2xl bg-neutral-900/40 ring-1 ring-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)]"
                    )}
                  >
                    <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-neutral-950/80 prose-pre:border prose-pre:border-neutral-800/50 prose-a:text-indigo-400 prose-headings:text-indigo-300 prose-strong:text-indigo-200">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Actions for Model Messages */}
                {msg.role === 'model' && (
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity px-2">
                    <button 
                      onClick={() => setReplyingTo({ text: msg.text, index: idx })}
                      className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20"
                    >
                      <Reply className="w-3 h-3" /> 回覆此段落
                    </button>
                    <button 
                      onClick={() => setSelectedFinalIndex(isSelected ? null : idx)}
                      className={clsx(
                        "flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded border transition-colors",
                        isSelected 
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                          : "bg-neutral-800/50 text-neutral-400 hover:text-white border-neutral-700/50"
                      )}
                    >
                      <CheckCircle2 className="w-3 h-3" /> 
                      {isSelected ? '已設為最終定案' : '設為最終定案'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-4xl">
            <div className="w-10 h-10 rounded-full bg-indigo-900/40 border border-indigo-500/50 text-indigo-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/60 backdrop-blur-md border border-indigo-500/30 flex items-center gap-3 text-indigo-300 font-mono text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />
              PROCESSING_DATA...
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className={clsx(
          "p-4 border-t border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl transition-colors",
          isDragging && "bg-neutral-900/90 border-indigo-500/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="max-w-4xl mx-auto relative flex flex-col gap-2">
          
          <AnimatePresence>
            {replyingTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="flex items-center justify-between bg-indigo-900/20 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2 text-indigo-300 truncate">
                  <Reply className="w-4 h-4 shrink-0" />
                  <span className="truncate font-mono text-xs">回覆: {replyingTo.text.substring(0, 60)}...</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-indigo-400 hover:text-indigo-200">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex flex-col gap-2">
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1 px-2">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-700 bg-neutral-800 group shadow-sm">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Paperclip className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1.5 py-0.5 text-[10px] text-white font-medium truncate text-center">
                      {getFileLabel(file, idx)}
                    </div>
                    <button 
                      onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative flex items-center bg-[#1a1a1a] border border-neutral-800 rounded-full px-2 py-2 shadow-inner">
              <button 
                onClick={handlePaperclipClick}
                className="text-neutral-400 hover:text-white cursor-pointer transition-colors shrink-0 ml-2 mr-3"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                className="hidden" 
                multiple 
                ref={fileInputRef}
                onChange={handleFileUpload} 
              />
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="輸入你的想法..."
                className="flex-1 bg-transparent text-white placeholder:text-neutral-500 focus:outline-none resize-none py-2"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={(!input.trim() && uploadedFiles.length === 0) || isLoading}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-200 disabled:bg-neutral-700 text-black disabled:text-neutral-500 flex items-center justify-center shrink-0 ml-3 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
