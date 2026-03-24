/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Lobby from './pages/common/Lobby';
import StoryStep1 from './pages/story/StoryStep1';
import CharacterConceptStep2 from './pages/story/CharacterConceptStep2';
import CharacterDesignStep3 from './pages/story/CharacterDesignStep3';
import CharacterSheetStep4 from './pages/story/CharacterSheetStep4';
import SceneGenerationStep5 from './pages/story/SceneGenerationStep5';
import CompositingStep6 from './pages/story/CompositingStep6';
import VideoGenerationStep7 from './pages/story/VideoGenerationStep7';
import MusicStep from './pages/story/MusicStep';
import PromoScriptStep2 from './pages/promo/PromoScriptStep2';
import PromoVisualsStep3 from './pages/promo/PromoVisualsStep3';
import PromoVideoStep4 from './pages/promo/PromoVideoStep4';
import PromoTransitionStep5 from './pages/promo/PromoTransitionStep5';
import AdminDashboard from './pages/common/AdminDashboard';
import ProjectArchive from './pages/common/ProjectArchive';

// Declare global window property for aistudio
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // If aistudio is not available, assume we can proceed (e.g. local dev)
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success after triggering to avoid race conditions
      setHasKey(true);
    }
  };

  if (hasKey === null) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6">
          <h1 className="text-2xl font-bold tracking-tight">API Key Required</h1>
          <p className="text-zinc-400">
            This application requires a paid Gemini API key to generate high-quality images. 
            Please select your API key to continue.
          </p>
          <button 
            onClick={handleSelectKey}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Select API Key
          </button>
          <p className="text-xs text-zinc-500 mt-4">
            You must select an API key from a paid Google Cloud project. <br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
              Learn more about billing
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Lobby />} />
          <Route path="step1" element={<StoryStep1 />} />
          <Route path="step2" element={<CharacterConceptStep2 />} />
          <Route path="step3" element={<CharacterDesignStep3 />} />
          <Route path="step4" element={<CharacterSheetStep4 />} />
          <Route path="step5" element={<SceneGenerationStep5 />} />
          <Route path="step6" element={<CompositingStep6 />} />
          <Route path="step7" element={<VideoGenerationStep7 />} />
          <Route path="step-music" element={<MusicStep />} />
          <Route path="step2a" element={<PromoScriptStep2 />} />
          <Route path="step3a" element={<PromoVisualsStep3 />} />
          <Route path="step4a" element={<PromoVideoStep4 />} />
          <Route path="step5a" element={<PromoTransitionStep5 />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="archive" element={<ProjectArchive />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
