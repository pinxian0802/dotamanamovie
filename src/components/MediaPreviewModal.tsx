import React, { useEffect, useState } from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';

interface MediaPreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string | null;
  mediaType: 'image' | 'video';
  title?: string;
}

export default function MediaPreviewModal({
  open,
  onClose,
  src,
  mediaType,
  title,
}: MediaPreviewModalProps) {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setZoom(1);
  }, [open, src, mediaType]);

  const increaseZoom = () => {
    setZoom((previousZoom) => Math.min(previousZoom + 0.25, 4));
  };

  const decreaseZoom = () => {
    setZoom((previousZoom) => Math.max(previousZoom - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoom(1);
  };

  if (!open || !src) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <div className="truncate pr-4 text-sm font-medium text-neutral-200">
            {title || (mediaType === 'video' ? '影片預覽' : '圖片預覽')}
          </div>
          <div className="flex items-center gap-2">
            {mediaType === 'image' && (
              <>
                <button
                  onClick={decreaseZoom}
                  className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  title="縮小"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  title="重設縮放"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={increaseZoom}
                  className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
                  title="放大"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <div className="min-w-14 text-center text-xs font-medium text-neutral-400">
                  {Math.round(zoom * 100)}%
                </div>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
              title="關閉預覽"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex min-h-[50vh] items-center justify-center overflow-auto bg-black p-4">
          {mediaType === 'video' ? (
            <video
              src={src}
              controls
              autoPlay
              className="max-h-[78vh] max-w-full rounded-lg"
              crossOrigin="anonymous"
            />
          ) : (
            <img
              src={src}
              alt={title || 'Preview'}
              className="max-h-[78vh] max-w-full rounded-lg object-contain transition-transform duration-150"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
