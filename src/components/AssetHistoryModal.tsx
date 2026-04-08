import React from 'react';
import { Download, FolderOpen, History, X } from 'lucide-react';
import { type AssetHistoryEntry } from '../store/useProjectStore';

type AssetHistoryModalProps = {
  open: boolean;
  title: string;
  entries: AssetHistoryEntry[];
  onClose: () => void;
  onRestore: (entry: AssetHistoryEntry, value?: string) => void;
};

const downloadAsset = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AssetHistoryModal({
  open,
  title,
  entries,
  onClose,
  onRestore,
}: AssetHistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl border border-neutral-800 bg-neutral-950/95 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-5 w-5 text-amber-300" />
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-neutral-400">依時間排序保留這個節點曾經生成過的版本</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-neutral-500 transition hover:bg-neutral-900 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 px-6 py-12 text-center text-neutral-500">
              <History className="mx-auto mb-3 h-10 w-10 opacity-40" />
              目前還沒有歷史版本。
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-white">{entry.title}</div>
                      <div className="text-xs text-neutral-500">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.value && (
                        <button
                          onClick={() => downloadAsset(entry.value, `${entry.title}-${entry.id}`)}
                          className="rounded-lg border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Download className="h-3.5 w-3.5" />
                            下載
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => onRestore(entry)}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-black transition hover:bg-emerald-400"
                      >
                        還原到主畫面
                      </button>
                    </div>
                  </div>

                  {entry.kind === 'text' ? (
                    <pre className="max-h-48 overflow-auto rounded-xl border border-neutral-800 bg-black/30 p-3 text-xs leading-6 text-neutral-300 whitespace-pre-wrap">
                      {entry.value}
                    </pre>
                  ) : entry.variants?.length ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {entry.variants.map((variant, index) => (
                          <button
                            key={`${entry.id}-${index}`}
                            onClick={() => onRestore(entry, variant)}
                            className="overflow-hidden rounded-xl border border-neutral-800 bg-black/20 transition hover:border-emerald-500/50"
                          >
                            <img src={variant} alt={`${entry.title}-${index + 1}`} className="h-32 w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : entry.kind === 'image' ? (
                    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-black/20">
                      <img src={entry.value} alt={entry.title} className="max-h-96 w-full object-contain" />
                    </div>
                  ) : (
                    <video src={entry.value} controls className="max-h-96 w-full rounded-xl border border-neutral-800 bg-black/40" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
