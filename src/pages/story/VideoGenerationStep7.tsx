import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { Video, Loader2, Play, CheckCircle2, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { downloadAsset } from '../../utils/download';
import MediaPreviewModal from '../../components/MediaPreviewModal';

export default function VideoGenerationStep7() {
  const navigate = useNavigate();
  const { scenePrompts, compositedScenes, videoScenes, setVideoScene, setCurrentStep, markStepCompleted } = useProjectStore();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [previewMedia, setPreviewMedia] = useState<{ src: string; title: string; mediaType: 'image' | 'video' } | null>(null);

  useEffect(() => {
    setCurrentStep(7);
  }, []);

  const generateVideo = async (sceneNumber: string, baseImage: string) => {
    setLoadingStates((prev) => ({ ...prev, [sceneNumber]: true }));
    try {
      // Mock video generation API call (e.g. Runway Gen-3 / Luma)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For mock, we'll just use a placeholder video or the same image with a play icon
      const mockVideoUrl = baseImage; // In a real app, this would be a .mp4 url
      setVideoScene(sceneNumber, mockVideoUrl);
    } catch (error) {
      console.error(error);
      alert(`影片生成 ${sceneNumber} 失敗，請重試。`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const handleNext = () => {
    markStepCompleted(7);
    navigate('/step8');
  };

  const allGenerated = scenePrompts.length > 0 && scenePrompts.every((scene) => videoScenes[scene.sceneNumber]);

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950/50">
        <div>
          <h2 className="text-xl font-semibold text-white">7. 動態影片生成</h2>
          <p className="text-sm text-neutral-400">將靜態合成圖轉換為動態影片 (Runway Gen-3 / Luma)</p>
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
            const baseImage = compositedScenes[scene.sceneNumber];
            const videoUrl = videoScenes[scene.sceneNumber];
            const isLoading = loadingStates[scene.sceneNumber];

            if (!baseImage) return null;

            return (
              <div key={scene.sceneNumber} className="bg-neutral-800 border border-neutral-700 rounded-2xl p-6 flex flex-col lg:flex-row gap-8">
                {/* Left: Source Image */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg font-bold text-sm">
                      {scene.sceneNumber}
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-neutral-700 text-neutral-300 rounded uppercase tracking-wider">
                      起始影格
                    </span>
                  </div>
                  <div className="aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700 relative">
                    <button
                      onClick={() => setPreviewMedia({ src: baseImage, title: `分鏡 ${scene.sceneNumber} 基底圖`, mediaType: 'image' })}
                      className="h-full w-full"
                    >
                      <img src={baseImage} alt="Base" className="w-full h-full object-cover" />
                    </button>
                  </div>
                  <div className="text-sm text-neutral-400 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
                    <p className="font-semibold text-neutral-300 mb-1">動態提示詞：</p>
                    <p>{scene.description}</p>
                  </div>
                </div>

                {/* Middle: Action */}
                <div className="flex items-center justify-center lg:w-32">
                  <button
                    onClick={() => generateVideo(scene.sceneNumber, baseImage)}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    ) : (
                      <Video className="w-8 h-8" />
                    )}
                    <span className="text-xs font-medium">{isLoading ? '生成中...' : '生成影片'}</span>
                  </button>
                </div>

                {/* Right: Result */}
                <div className="w-full lg:w-1/2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded uppercase tracking-wider">
                      動態影片結果
                    </span>
                    {videoUrl && (
                      <button
                        onClick={() => downloadAsset(videoUrl, `scene_${scene.sceneNumber}_video.mp4`)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-md text-neutral-300 transition-colors"
                        title="下載影片"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className={clsx(
                    "aspect-video rounded-xl overflow-hidden border-2 relative flex items-center justify-center transition-all",
                    videoUrl ? "border-indigo-500/50 bg-neutral-900" : "border-dashed border-neutral-700 bg-neutral-800/50"
                  )}>
                    {videoUrl ? (
                      <button
                        onClick={() =>
                          setPreviewMedia({
                            src: videoUrl,
                            title: `分鏡 ${scene.sceneNumber} 影片預覽`,
                            mediaType: videoUrl.endsWith('.mp4') || videoUrl.startsWith('blob:') ? 'video' : 'image',
                          })
                        }
                        className="relative h-full w-full"
                      >
                        <img src={videoUrl} alt="Video Thumbnail" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                            <Play className="w-8 h-8 text-white ml-1" />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="text-neutral-500 flex flex-col items-center gap-2">
                        <Video className="w-8 h-8 opacity-50" />
                        <span className="text-sm">尚未生成</span>
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
        open={Boolean(previewMedia)}
        onClose={() => setPreviewMedia(null)}
        src={previewMedia?.src || null}
        mediaType={previewMedia?.mediaType || 'image'}
        title={previewMedia?.title}
      />
    </div>
  );
}
