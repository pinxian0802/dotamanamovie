import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set as idbSet, del } from 'idb-keyval';

const storage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  images?: string[];
}

export interface CharacterPrompt {
  name: string;
  description: string;
  englishPrompt: string;
}

export interface ScenePrompt {
  sceneNumber: string;
  description: string;
  englishPrompt: string;
}

export interface PromoStoryboardScene {
  scene_number: number;
  nano_banana_pro_prompts: {
    start_frame: string;
    start_frame_zh: string;
    end_frame: string;
    end_frame_zh: string;
  };
}

export interface PromoScriptData {
  script_dialogue: string;
  storyboard: PromoStoryboardScene[];
}

interface ProjectState {
  // Step 1
  storyChatHistory: ChatMessage[];
  storyData: string; // Outline -> Script -> Storyboard combined
  setStoryChatHistory: (history: ChatMessage[]) => void;
  setStoryData: (data: string) => void;

  // Step 2
  characterPrompts: CharacterPrompt[];
  setCharacterPrompts: (prompts: CharacterPrompt[]) => void;

  // Step 3
  characterImages: Record<string, string>; // name -> base64 image
  setCharacterImage: (name: string, image: string) => void;

  // Step 4
  characterConceptSheets: Record<string, string>; // name -> base64 image
  setCharacterConceptSheet: (name: string, image: string) => void;

  // Step 5
  scenePrompts: ScenePrompt[];
  setScenePrompts: (prompts: ScenePrompt[]) => void;
  sceneImages: Record<string, string>; // sceneNumber -> base64 image
  setSceneImage: (sceneNumber: string, image: string) => void;

  // Step 6
  compositedScenes: Record<string, string>; // sceneNumber -> base64 image
  setCompositedScene: (sceneNumber: string, image: string) => void;

  // Step 7
  videoScenes: Record<string, string>; // sceneNumber -> video url
  setVideoScene: (sceneNumber: string, videoUrl: string) => void;

  // Step 8
  voiceScenes: Record<string, string>; // sceneNumber -> audio/video url
  setVoiceScene: (sceneNumber: string, url: string) => void;

  // Step 9
  finalVideo: string | null;
  setFinalVideo: (url: string | null) => void;

  // Promo Workflow
  promoScriptData: PromoScriptData | null;
  setPromoScriptData: (data: PromoScriptData | null) => void;
  updatePromoScenePrompts: (sceneNumber: number, prompts: Partial<PromoStoryboardScene['nano_banana_pro_prompts']>) => void;
  promoImages: Record<string, { start: string; end: string }>; // scene_number -> {start, end} base64
  setPromoImage: (sceneNumber: number, type: 'start' | 'end', image: string) => void;
  promoVideos: Record<string, string>; // scene_number -> video url
  setPromoVideo: (sceneNumber: number, videoUrl: string) => void;
  promoTransitions: Record<string, string>; // scene_number -> transition video url
  setPromoTransition: (sceneNumber: number, videoUrl: string) => void;

  // Global
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  workflowType: 'gem' | 'promo' | null;
  setWorkflowType: (type: 'gem' | 'promo' | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completedSteps: number[];
  markStepCompleted: (step: number) => void;
  resetProject: () => void;
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;

  // History & Admin
  projectHistory: any[];
  addProjectToHistory: () => void;
  autoSaveProject: () => void;
  pinProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, newName: string) => void;
  loadProject: (id: string) => void;
  apiUsage: Record<string, number>;
  incrementApiUsage: (model: string) => void;
  geminiUsage: Record<string, { calls: number; promptTokens: number; outputTokens: number; estimatedCostUsd: number }>;
  recordGeminiUsage: (model: string, usage: { calls?: number; promptTokens?: number; outputTokens?: number; estimatedCostUsd?: number }) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
  storyChatHistory: [],
  storyData: '',
  setStoryChatHistory: (history) => set({ storyChatHistory: history }),
  setStoryData: (data) => set({ storyData: data }),

  characterPrompts: [],
  setCharacterPrompts: (prompts) => set({ characterPrompts: prompts }),

  characterImages: {},
  setCharacterImage: (name, image) => 
    set((state) => ({ characterImages: { ...state.characterImages, [name]: image } })),

  characterConceptSheets: {},
  setCharacterConceptSheet: (name, image) => 
    set((state) => ({ characterConceptSheets: { ...state.characterConceptSheets, [name]: image } })),

  scenePrompts: [],
  setScenePrompts: (prompts) => set({ scenePrompts: prompts }),
  sceneImages: {},
  setSceneImage: (sceneNumber, image) => 
    set((state) => ({ sceneImages: { ...state.sceneImages, [sceneNumber]: image } })),

  compositedScenes: {},
  setCompositedScene: (sceneNumber, image) => 
    set((state) => ({ compositedScenes: { ...state.compositedScenes, [sceneNumber]: image } })),

  videoScenes: {},
  setVideoScene: (sceneNumber, videoUrl) => 
    set((state) => ({ videoScenes: { ...state.videoScenes, [sceneNumber]: videoUrl } })),

  voiceScenes: {},
  setVoiceScene: (sceneNumber, url) => 
    set((state) => ({ voiceScenes: { ...state.voiceScenes, [sceneNumber]: url } })),

  finalVideo: null,
  setFinalVideo: (url) => set({ finalVideo: url }),

  promoScriptData: null,
  setPromoScriptData: (data) => set({ promoScriptData: data }),
  updatePromoScenePrompts: (sceneNumber, prompts) => set((state) => {
    if (!state.promoScriptData) return state;
    const newStoryboard = state.promoScriptData.storyboard.map(scene => {
      if (scene.scene_number === sceneNumber) {
        return {
          ...scene,
          nano_banana_pro_prompts: {
            ...scene.nano_banana_pro_prompts,
            ...prompts
          }
        };
      }
      return scene;
    });
    return {
      promoScriptData: {
        ...state.promoScriptData,
        storyboard: newStoryboard
      }
    };
  }),
  promoImages: {},
  setPromoImage: (sceneNumber, type, image) => 
    set((state) => ({ 
      promoImages: { 
        ...state.promoImages, 
        [sceneNumber]: { 
          ...(state.promoImages[sceneNumber] || { start: '', end: '' }), 
          [type]: image 
        } 
      } 
    })),
  promoVideos: {},
  setPromoVideo: (sceneNumber, videoUrl) => 
    set((state) => ({ promoVideos: { ...state.promoVideos, [sceneNumber]: videoUrl } })),
  promoTransitions: {},
  setPromoTransition: (sceneNumber, videoUrl) => 
    set((state) => ({ promoTransitions: { ...state.promoTransitions, [sceneNumber]: videoUrl } })),

  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  workflowType: null,
  setWorkflowType: (type) => set({ workflowType: type }),

  currentStep: 0,
  setCurrentStep: (step) => set({ currentStep: step }),
  completedSteps: [],
  markStepCompleted: (step) => set((state) => ({ 
    completedSteps: state.completedSteps.includes(step) 
      ? state.completedSteps 
      : [...state.completedSteps, step] 
  })),
  
  name: '',
  setName: (name) => set({ name }),
  description: '',
  setDescription: (description) => set({ description }),

  projectHistory: [],
  addProjectToHistory: () => {
    const state = get();
    const { projectHistory, currentProjectId, ...stateToSave } = state;
    const newId = Date.now().toString();
    
    set((s) => ({ 
      currentProjectId: newId,
      projectHistory: [...s.projectHistory, { 
        id: newId, 
        name: state.name || 'Untitled Project', 
        description: state.description, 
        state: stateToSave, 
        pinned: false, 
        updatedAt: new Date().toISOString() 
      }] 
    }));
  },
  autoSaveProject: () => {
    const state = get();
    if (!state.currentProjectId) return;
    
    const { projectHistory, currentProjectId, ...stateToSave } = state;
    
    const currentProject = state.projectHistory.find(p => p.id === currentProjectId);
    if (!currentProject) return;

    // Compare state to avoid unnecessary saves
    if (JSON.stringify(currentProject.state) === JSON.stringify(stateToSave)) {
      return;
    }
    
    set((s) => ({
      projectHistory: s.projectHistory.map(p => 
        p.id === currentProjectId 
          ? { 
              ...p, 
              name: state.name || 'Untitled Project', 
              description: state.description, 
              state: stateToSave, 
              updatedAt: new Date().toISOString() 
            } 
          : p
      )
    }));
  },
  pinProject: (id) => set((state) => ({ projectHistory: state.projectHistory.map(p => p.id === id ? { ...p, pinned: !p.pinned } : p) })),
  deleteProject: (id) => set((state) => ({ projectHistory: state.projectHistory.filter(p => p.id !== id) })),
  renameProject: (id, newName) => set((state) => ({ projectHistory: state.projectHistory.map(p => p.id === id ? { ...p, name: newName } : p) })),
  loadProject: (id) => {
    const state = get();
    const project = state.projectHistory.find(p => p.id === id);
    if (project) {
      // Restore state but keep the current projectHistory and apiUsage
      set({ 
        ...project.state, 
        currentProjectId: id,
        projectHistory: state.projectHistory,
        apiUsage: state.apiUsage
      });
    }
  },
  apiUsage: {},
  incrementApiUsage: (model) => set((state) => ({ apiUsage: { ...state.apiUsage, [model]: (state.apiUsage[model] || 0) + 1 } })),
  geminiUsage: {},
  recordGeminiUsage: (model, usage) => set((state) => {
    const prev = state.geminiUsage[model] || { calls: 0, promptTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
    return {
      geminiUsage: {
        ...state.geminiUsage,
        [model]: {
          calls: prev.calls + (usage.calls || 0),
          promptTokens: prev.promptTokens + (usage.promptTokens || 0),
          outputTokens: prev.outputTokens + (usage.outputTokens || 0),
          estimatedCostUsd: prev.estimatedCostUsd + (usage.estimatedCostUsd || 0),
        },
      },
      apiUsage: {
        ...state.apiUsage,
        [model]: (state.apiUsage[model] || 0) + (usage.calls || 0),
      },
    };
  }),
  
  resetProject: () => set({
    currentProjectId: null,
    storyChatHistory: [],
    storyData: '',
    characterPrompts: [],
    characterImages: {},
    characterConceptSheets: {},
    scenePrompts: [],
    sceneImages: {},
    compositedScenes: {},
    videoScenes: {},
    voiceScenes: {},
    promoScriptData: null,
    promoImages: {},
    promoVideos: {},
    promoTransitions: {},
    finalVideo: null,
    workflowType: null,
    currentStep: 1,
    completedSteps: [],
    name: '',
    description: '',
    geminiUsage: {},
  }),
}), { 
  name: 'project-storage',
  storage: createJSONStorage(() => storage),
}));
