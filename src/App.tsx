/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import PromoStoryStep1 from './pages/promo-story/PromoStoryStep1';
import AdminDashboard from './pages/common/AdminDashboard';
import ProjectArchive from './pages/common/ProjectArchive';
import ApiKeyPage from './pages/common/ApiKeyPage';

export default function App() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      setHasHydrated(true);
    };

    hydrate();
  }, []);

  if (!hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Lobby />} />
          <Route path="api-key" element={<ApiKeyPage />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="archive" element={<ProjectArchive />} />
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
          <Route path="promo-story/step1" element={<PromoStoryStep1 />} />
          <Route path="promo-story/step2" element={<PromoVisualsStep3 />} />
          <Route path="promo-story/step3" element={<PromoVideoStep4 />} />
          <Route path="promo-story/step4" element={<PromoTransitionStep5 />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
