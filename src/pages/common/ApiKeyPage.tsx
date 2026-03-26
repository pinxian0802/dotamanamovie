import React from 'react';
import { KeyRound, ShieldCheck, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { API_KEY_COPY } from '../../config/workflowCopy';

export default function ApiKeyPage() {
  const navigate = useNavigate();
  const savedApiKey = useProjectStore((state) => state.apiKey);
  const setApiKey = useProjectStore((state) => state.setApiKey);
  const clearApiKey = useProjectStore((state) => state.clearApiKey);
  const [draftKey, setDraftKey] = React.useState(savedApiKey);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setDraftKey(savedApiKey);
  }, [savedApiKey]);

  const handleSave = () => {
    setApiKey(draftKey);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const handleClear = () => {
    clearApiKey();
    setDraftKey('');
    setSaved(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-800 bg-neutral-950/85 backdrop-blur-xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm text-orange-300">
              <KeyRound className="w-4 h-4" />
              {API_KEY_COPY.badge}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">{API_KEY_COPY.title}</h1>
              <p className="mt-2 text-neutral-400">{API_KEY_COPY.description}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-neutral-700 hover:text-white"
          >
            {API_KEY_COPY.back}
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-neutral-300">{API_KEY_COPY.inputLabel}</label>
          <textarea
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            placeholder={API_KEY_COPY.placeholder}
            spellCheck={false}
            className="min-h-36 w-full rounded-2xl border border-neutral-800 bg-neutral-900 px-4 py-4 font-mono text-sm text-white outline-none transition-colors focus:border-orange-500/50"
          />

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-400">
            <div className="flex items-center gap-2 text-neutral-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {API_KEY_COPY.storageTitle}
            </div>
            <p>{API_KEY_COPY.storageDescription}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={handleSave}
              disabled={!draftKey.trim()}
              className="rounded-xl bg-orange-600 px-5 py-3 font-medium text-white transition-colors hover:bg-orange-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {API_KEY_COPY.save}
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-3 font-medium text-neutral-300 transition-colors hover:border-red-500/40 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
              {API_KEY_COPY.clear}
            </button>
            {saved && <span className="text-sm text-emerald-400">{API_KEY_COPY.saved}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
