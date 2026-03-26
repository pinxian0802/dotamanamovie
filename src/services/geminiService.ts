import { GoogleGenAI, Type } from '@google/genai';
import { useProjectStore } from '../store/useProjectStore';
import {
  STORY_CHAT_SYSTEM_PROMPT,
  buildCharacterPromptRequest,
  buildScenePromptRequest,
  buildPromoScriptPrompt,
  PROMO_SCRIPT_SYSTEM_PROMPT,
  PROMO_SCRIPT_ADJUST_SYSTEM_PROMPT,
  PROMO_PROMPT_ADJUST_SYSTEM_PROMPT,
} from '../config/promptTemplates';

const TEXT_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const VIDEO_MODEL = 'veo-3.1-fast-generate-preview';

export interface GeminiReferenceFile {
  mimeType: string;
  data: string;
  name?: string;
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

export interface PromoScenePrompts {
  start_frame: string;
  start_frame_zh: string;
  end_frame: string;
  end_frame_zh: string;
}

export interface PromoStoryboardScene {
  scene_number: number;
  scene_outline?: string;
  duration_seconds?: number;
  default_shot_size?: string;
  camera_setup?: string;
  audio_design?: string;
  subtitle_voiceover?: string;
  continuity_summary?: string;
  continuity_prompt?: {
    en: string;
    zh: string;
  };
  transition?: {
    logic: string;
    prompt_en: string;
    prompt_zh: string;
  };
  nano_banana_pro_prompts: PromoScenePrompts;
}

export interface PromoScriptData {
  creative_rationale?: string;
  story_outline?: string;
  total_duration_seconds?: number;
  script_dialogue: string;
  storyboard: PromoStoryboardScene[];
}

export interface SunoPrompt {
  id: string;
  style: string;
  description: string;
  prompt: string;
  reason: string;
}

type GenerateContentArgs = {
  contents: any;
  model?: string;
  config?: Record<string, any>;
};

type UsageRecord = {
  calls?: number;
  promptTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
};

type PromptMessage = { role: 'user' | 'model'; text: string; images?: string[] };

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getApiKey = () => useProjectStore.getState().apiKey;

const PRICE_TABLE = {
  textInputPer1M: 0.5,
  textOutputPer1M: 3,
  imageInputPer1M: 0.3,
  imageOutputPerImage: 0.039,
  videoOutputPerVideo: 0.15,
  flashImageInputPer1M: 0.3,
  flashImageOutputPerImage: 0.039,
} as const;

const normalizeUsage = (response: any) => response?.usageMetadata || response?.usage_metadata || {};

const getCountTokensTotal = (result: any) => {
  if (typeof result === 'number') return result;
  return result?.totalTokens ?? result?.total_tokens ?? result?.totalTokenCount ?? result?.total_token_count ?? 0;
};

const getUsageToken = (usage: any, camel: string, snake: string) => {
  const value = usage?.[camel] ?? usage?.[snake];
  return typeof value === 'number' ? value : 0;
};

const recordUsage = (model: string, usage: UsageRecord) => {
  const store = useProjectStore.getState();
  if (store.recordGeminiUsage) {
    store.recordGeminiUsage(model, usage);
  }
};

const isUnsupportedCountTokensError = (error: unknown) => {
  const message = error instanceof Error ? error.message : JSON.stringify(error) || '';
  return message.includes('countTokens') && (
    message.includes('not supported for countTokens') ||
    message.includes('"status":"NOT_FOUND"') ||
    message.includes('NOT_FOUND')
  );
};

const estimateTextCost = (promptTokens: number, outputTokens: number) => {
  return (promptTokens / 1_000_000) * PRICE_TABLE.textInputPer1M + (outputTokens / 1_000_000) * PRICE_TABLE.textOutputPer1M;
};

const estimateImageCost = (promptTokens: number, imageCount = 1) => {
  return (promptTokens / 1_000_000) * PRICE_TABLE.imageInputPer1M + imageCount * PRICE_TABLE.imageOutputPerImage;
};

const estimateVideoCost = (promptTokens: number, videoCount = 1) => {
  return (promptTokens / 1_000_000) * PRICE_TABLE.textInputPer1M + videoCount * PRICE_TABLE.videoOutputPerVideo;
};

export const getAi = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key is required. Please enter it in the API Key page.');
  }
  return new GoogleGenAI({ apiKey });
};

const generateContent = async ({ contents, model = TEXT_MODEL, config = {} }: GenerateContentArgs) => {
  const ai = getAi();
  return ai.models.generateContent({ model, contents, config });
};

export const countTokens = async (contents: any, model = TEXT_MODEL) => {
  const ai = getAi();
  const result = await ai.models.countTokens({ model, contents });
  return getCountTokensTotal(result);
};

const generateTextWithUsage = async ({
  model = TEXT_MODEL,
  contents,
  config = {},
}: GenerateContentArgs) => {
  const promptTokens = await countTokens(contents, model);
  const response = await generateContent({ model, contents, config });
  const usage = normalizeUsage(response);
  const promptTokenCount = getUsageToken(usage, 'promptTokenCount', 'prompt_token_count') || promptTokens;
  const outputTokens = getUsageToken(usage, 'candidatesTokenCount', 'candidates_token_count');
  const estimatedCostUsd = estimateTextCost(promptTokenCount, outputTokens);

  recordUsage(model, {
    calls: 1,
    promptTokens: promptTokenCount,
    outputTokens,
    estimatedCostUsd,
  });

  return response;
};

const buildParts = (prompt: string, referenceFiles: GeminiReferenceFile[] = []) => {
  const parts: any[] = [{ text: prompt }];

  for (const file of referenceFiles) {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data,
      },
    });
  }

  return parts;
};

const promoPromptSchema = {
  type: Type.OBJECT,
  properties: {
    start_frame: { type: Type.STRING, description: '首幀英文提示詞' },
    start_frame_zh: { type: Type.STRING, description: '首幀中文翻譯' },
    end_frame: { type: Type.STRING, description: '尾幀英文提示詞' },
    end_frame_zh: { type: Type.STRING, description: '尾幀中文翻譯' },
  },
  required: ['start_frame', 'start_frame_zh', 'end_frame', 'end_frame_zh'],
} as const;

const buildPromoStoryboardSceneSchema = (aspectRatio: string) => ({
  type: Type.OBJECT,
  properties: {
    scene_number: { type: Type.INTEGER },
    scene_outline: { type: Type.STRING },
    duration_seconds: { type: Type.INTEGER },
    default_shot_size: {
      type: Type.STRING,
      description: '預設景別，只能是 medium close-up、close-up、extreme close-up、macro shot 其中之一',
    },
    camera_setup: { type: Type.STRING },
    audio_design: { type: Type.STRING },
    subtitle_voiceover: {
      type: Type.STRING,
      description: '字幕或旁白，每一句之間必須空一行',
    },
    nano_banana_pro_prompts: {
      type: Type.OBJECT,
      properties: {
        start_frame: {
          type: Type.STRING,
          description: `首幀英文提示詞，需包含場景、光線、風格、鏡頭，並適用於 ${aspectRatio}`,
        },
        start_frame_zh: { type: Type.STRING },
        end_frame: {
          type: Type.STRING,
          description: `尾幀英文提示詞，需延續首幀場景語法，並適用於 ${aspectRatio}`,
        },
        end_frame_zh: { type: Type.STRING },
      },
      required: ['start_frame', 'start_frame_zh', 'end_frame', 'end_frame_zh'],
    },
    continuity_summary: { type: Type.STRING },
    continuity_prompt: {
      type: Type.OBJECT,
      properties: {
        en: { type: Type.STRING },
        zh: { type: Type.STRING },
      },
      required: ['en', 'zh'],
    },
    transition: {
      type: Type.OBJECT,
      properties: {
        logic: { type: Type.STRING },
        prompt_en: { type: Type.STRING },
        prompt_zh: { type: Type.STRING },
      },
      required: ['logic', 'prompt_en', 'prompt_zh'],
    },
  },
  required: [
    'scene_number',
    'scene_outline',
    'duration_seconds',
    'default_shot_size',
    'camera_setup',
    'audio_design',
    'subtitle_voiceover',
    'nano_banana_pro_prompts',
    'continuity_summary',
    'continuity_prompt',
    'transition',
  ],
});

const buildPromoScriptSchema = (aspectRatio: string) => ({
  type: Type.OBJECT,
  properties: {
    creative_rationale: { type: Type.STRING },
    story_outline: { type: Type.STRING },
    total_duration_seconds: { type: Type.INTEGER },
    script_dialogue: {
      type: Type.STRING,
      description: '全片字幕 / 旁白內容，每一句之間必須空一行',
    },
    storyboard: {
      type: Type.ARRAY,
      items: buildPromoStoryboardSceneSchema(aspectRatio),
    },
  },
  required: ['creative_rationale', 'story_outline', 'script_dialogue', 'storyboard'],
});

const extractDataUrl = (value: string) => {
  const matches = value.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }

  return {
    mimeType: matches[1],
    data: matches[2],
  };
};

const stripJsonFence = (text: string) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const genericFence = trimmed.match(/```\s*([\s\S]*?)\s*```/i);
  if (genericFence?.[1]) {
    return genericFence[1].trim();
  }

  return trimmed;
};

const parseJsonResponse = <T,>(text: string, fallbackLabel: string): T => {
  const cleaned = stripJsonFence(text);

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    throw new Error(`${fallbackLabel}: invalid JSON response`);
  }
};

const classifyApiError = (error: unknown) => {
  const message = error instanceof Error ? error.message : JSON.stringify(error) || '';

  if (message.includes('Safety') || message.includes('400')) return 'safety';
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) return 'quota';
  if (message.includes('503') || message.includes('UNAVAILABLE')) return 'unavailable';
  if (message.includes('invalid JSON response')) return 'json';
  return 'unknown';
};

export const getGeminiErrorKind = classifyApiError;

export const generateChatResponse = async (
  history: PromptMessage[],
  _message: string,
  systemInstruction: string,
  model: string
) => {
  const isGpt = model === 'GPT';
  const adjustedInstruction = isGpt
    ? `${systemInstruction}\n\n(Please adopt a tone and style similar to GPT-5, being highly analytical, structured, and comprehensive.)`
    : systemInstruction;

  const parts: any[] = [{ text: `System Instruction: ${adjustedInstruction}\n\nConversation History:\n` }];

  for (const h of history) {
    parts.push({ text: `${h.role}: ${h.text}\n` });

    for (const image of h.images || []) {
      const match = extractDataUrl(image);
      if (!match) continue;

      parts.push({
        inlineData: {
          data: match.data,
          mimeType: match.mimeType,
        },
      });
    }
  }

  const response = await generateTextWithUsage({
    contents: { parts },
    config: {
      temperature: 0.8,
    },
  });

  return response.text || '';
};

export const generateCharacterPrompts = async (storyData: string) => {
  const prompt = buildCharacterPromptRequest(storyData);

  const response = await generateTextWithUsage({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: '角色名稱' },
            description: { type: Type.STRING, description: '角色中文描述 (相貌、髮型、服裝、體型、氣質)' },
            englishPrompt: { type: Type.STRING, description: '英文提示詞 (包含 white background 等關鍵字)' },
          },
          required: ['name', 'description', 'englishPrompt'],
        },
      },
    },
  });

  return parseJsonResponse<CharacterPrompt[]>(response.text || '[]', 'generateCharacterPrompts');
};

export const generateScenePrompts = async (storyboardData: string) => {
  const prompt = buildScenePromptRequest(storyboardData);

  const response = await generateTextWithUsage({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.STRING, description: '分鏡編號' },
            description: { type: Type.STRING, description: '場景中文描述' },
            englishPrompt: { type: Type.STRING, description: '英文提示詞' },
          },
          required: ['sceneNumber', 'description', 'englishPrompt'],
        },
      },
    },
  });

  return parseJsonResponse<ScenePrompt[]>(response.text || '[]', 'generateScenePrompts');
};

export const generatePromoScriptData = async ({
  productName,
  productFeatures,
  productContents,
  productOrigin,
  totalDurationSeconds,
  aspectRatio,
  includeCharacters,
  supplementaryText,
  referenceFiles = [],
}: {
  productName: string;
  productFeatures: string;
  productContents: string;
  productOrigin: string;
  totalDurationSeconds: string;
  aspectRatio: string;
  includeCharacters: boolean;
  supplementaryText: string;
  referenceFiles?: GeminiReferenceFile[];
}): Promise<PromoScriptData> => {
  const prompt = buildPromoScriptPrompt({
    productName,
    productFeatures,
    productContents,
    productOrigin,
    totalDurationSeconds,
    aspectRatio,
    includeCharacters,
    supplementaryText,
  });

  const response = await generateTextWithUsage({
    contents: { parts: buildParts(prompt, referenceFiles) },
    config: {
      systemInstruction: PROMO_SCRIPT_SYSTEM_PROMPT,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: buildPromoScriptSchema(aspectRatio),
    },
  });

  return parseJsonResponse<PromoScriptData>(response.text || '{}', 'generatePromoScriptData');
};

export const adjustPromoScriptData = async (currentScript: PromoScriptData, userInput: string) => {
  const prompt = `
Current Script & Storyboard:
${JSON.stringify(currentScript, null, 2)}

User Request:
${userInput}

Please update the script and storyboard based on the user request. Return the updated JSON in the same format.
`;

  const response = await generateTextWithUsage({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: PROMO_SCRIPT_ADJUST_SYSTEM_PROMPT,
      responseSchema: buildPromoScriptSchema('9:16'),
    },
  });

  return parseJsonResponse<PromoScriptData>(response.text || '{}', 'adjustPromoScriptData');
};

export const adjustPromoPrompt = async (userInput: string, currentPrompts: PromoScenePrompts) => {
  const prompt = `
你是一位專業的 AI 影像與影片提示詞工程師。
使用者對於目前的提示詞有一些修改建議，請根據使用者的指示，修改目前的提示詞。
請保持原本的格式，並回傳修改後的結果。

使用者指示：
${userInput}

目前的提示詞資料：
${JSON.stringify(currentPrompts, null, 2)}
`;

  const response = await generateTextWithUsage({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: PROMO_PROMPT_ADJUST_SYSTEM_PROMPT,
      responseSchema: promoPromptSchema,
    },
  });

  return parseJsonResponse<PromoScenePrompts>(response.text || '{}', 'adjustPromoPrompt');
};

export const adjustPromoPromptWithReferences = async (
  userInput: string,
  currentPrompts: PromoScenePrompts,
  referenceFiles: GeminiReferenceFile[] = [],
) => {
  const prompt = `
You are adjusting PROMO start and end frame prompts for a product ad workflow.
Return JSON only and preserve the existing response structure.
If reference images are attached, use them as visual guidance for product appearance, character face, pose, styling, composition, and scene context.

User request:
${userInput}

Current prompts:
${JSON.stringify(currentPrompts, null, 2)}
`;

  const response = await generateTextWithUsage({
    contents: { parts: buildParts(prompt, referenceFiles) },
    config: {
      responseMimeType: 'application/json',
      systemInstruction: PROMO_PROMPT_ADJUST_SYSTEM_PROMPT,
      responseSchema: promoPromptSchema,
    },
  });

  return parseJsonResponse<PromoScenePrompts>(response.text || '{}', 'adjustPromoPromptWithReferences');
};

export const generateMusicPrompts = async ({
  includeVocals,
  workflowType,
  promoScriptData,
  storyData,
}: {
  includeVocals: boolean;
  workflowType: 'promo' | 'gem';
  promoScriptData?: PromoScriptData | null;
  storyData?: string | null;
}) => {
  let contextData = '';

  if (workflowType === 'promo' && promoScriptData) {
    contextData = `
產品腳本與分鏡資料：
${promoScriptData.script_dialogue}
${JSON.stringify(promoScriptData.storyboard.map(s => s.nano_banana_pro_prompts), null, 2)}
`;
  } else if (workflowType === 'gem' && storyData) {
    contextData = `故事大綱與分鏡：\n${storyData}`;
  } else {
    contextData = '請提供通用的背景音樂提示詞。';
  }

  const prompt = `
請根據以下影片內容，提供 5 款適合此影片的 Suno 音樂生成提示詞 (Music Prompts)。
是否需要人聲 (Vocals)：${includeVocals ? '是 (請包含人聲與歌詞風格描述)' : '否 (純音樂 Instrumental，絕對不要人聲)'}

影片內容：
${contextData}
`;

  const response = await generateTextWithUsage({
    contents: prompt,
    config: {
      systemInstruction: '你是一位專業的配樂指導與 Suno AI 提示詞專家。請根據影片內容與風格，提供 5 種不同風格但都適合該影片的音樂提示詞。',
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: '唯一識別碼，例如 prompt_1' },
            style: { type: Type.STRING, description: '音樂風格簡述 (例如：史詩管弦樂、輕快流行電子)' },
            description: { type: Type.STRING, description: '為什麼這個風格適合這支影片的說明' },
            prompt: { type: Type.STRING, description: 'Suno 英文提示詞 (包含曲風、樂器、節奏等，若有人聲需註明 vocal style)' },
            reason: { type: Type.STRING, description: '為什麼這個提示詞適合這段影片的原因' },
          },
          required: ['id', 'style', 'description', 'prompt', 'reason'],
        },
      },
    },
  });

  const prompts = parseJsonResponse<SunoPrompt[]>(response.text || '[]', 'generateMusicPrompts');

  return prompts.map((prompt, index) => ({
    ...prompt,
    id: prompt.id || `prompt_${index + 1}`,
  }));
};

export const suggestMusicPrompts = async ({
  currentPrompts,
  history,
  userInput,
}: {
  currentPrompts: SunoPrompt[];
  history: Array<{ role: 'user' | 'model'; text: string }>;
  userInput: string;
}) => {
  const historyText = history.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');

  const prompt = `
你是一個專業的音樂配樂顧問。使用者正在為他們的影片尋找合適的 Suno 音樂提示詞。
目前已經生成的提示詞如下：
${JSON.stringify(currentPrompts, null, 2)}

歷史對話：
${historyText}

使用者現在說："${userInput}"

請根據使用者的需求，給予建議，並提供 1 到 2 個新的 Suno 提示詞。
`;

  const response = await generateTextWithUsage({
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: '唯一識別碼，例如 custom_prompt_1' },
            style: { type: Type.STRING },
            description: { type: Type.STRING },
            prompt: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ['id', 'style', 'description', 'prompt', 'reason'],
        },
      },
    },
  });

  const prompts = parseJsonResponse<SunoPrompt[]>(response.text || '[]', 'suggestMusicPrompts');

  return prompts.map((prompt, index) => ({
    ...prompt,
    id: prompt.id || `custom_${Date.now()}_${index}`,
  }));
};

export const generateImage = async (prompt: string, aspectRatio: string, referenceImage?: string) => {
  const contents: any = { parts: [] as any[] };

  if (referenceImage) {
    const matches = referenceImage.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      contents.parts.push({
        inlineData: {
          mimeType: matches[1],
          data: matches[2],
        },
      });
    }
  }

  contents.parts.push({ text: prompt });

  const promptTokens = await countTokens(contents, IMAGE_MODEL);

  const response = await generateContent({
    model: IMAGE_MODEL,
    contents,
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      recordUsage(IMAGE_MODEL, {
        calls: 1,
        promptTokens,
        outputTokens: 1290,
        estimatedCostUsd: estimateImageCost(promptTokens, 1),
      });
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('No image generated');
};

export const generatePromoVideo = async ({
  prompt,
  startFrameDataUrl,
  endFrameDataUrl,
  aspectRatio = '9:16',
  onProgress,
}: {
  prompt: string;
  startFrameDataUrl: string;
  endFrameDataUrl: string;
  aspectRatio?: string;
  onProgress?: (progress: number) => void;
}) => {
  const ai = getAi();

  const startFrame = extractDataUrl(startFrameDataUrl);
  const endFrame = extractDataUrl(endFrameDataUrl);

  if (!startFrame || !endFrame) {
    throw new Error('Missing start or end frame images');
  }

  let promptTokens = 0;
  try {
    promptTokens = await countTokens([
      { text: prompt },
      { inlineData: { mimeType: startFrame.mimeType, data: startFrame.data } },
      { inlineData: { mimeType: endFrame.mimeType, data: endFrame.data } },
    ], VIDEO_MODEL);
  } catch (error) {
    if (!isUnsupportedCountTokensError(error)) {
      throw error;
    }

    // Veo preview models may support video generation without supporting countTokens.
    // Fall back to counting the text prompt only so usage tracking doesn't block generation.
    try {
      promptTokens = await countTokens(prompt, TEXT_MODEL);
    } catch {
      promptTokens = 0;
    }
  }

  onProgress?.(10);

  let operation = await ai.models.generateVideos({
    model: VIDEO_MODEL,
    prompt,
    image: {
      imageBytes: startFrame.data,
      mimeType: startFrame.mimeType,
    },
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      lastFrame: {
        imageBytes: endFrame.data,
        mimeType: endFrame.mimeType,
      },
      aspectRatio,
    },
  });

  let elapsed = 0;
  while (!operation.done) {
    await delay(10000);
    elapsed += 10;
    onProgress?.(Math.min(10 + Math.floor((elapsed / 120) * 80), 90));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  onProgress?.(95);

  const operationResponse = operation.response as any;
  const downloadLink =
    operationResponse?.generatedVideos?.[0]?.video?.uri ||
    operationResponse?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
  if (!downloadLink) {
    throw new Error('No video URI returned');
  }

  const response = await fetch(downloadLink, {
    method: 'GET',
    headers: {
      'x-goog-api-key': getApiKey() || '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download generated video');
  }

  const blob = await response.blob();
  recordUsage(VIDEO_MODEL, {
    calls: 1,
    promptTokens,
    outputTokens: 0,
    estimatedCostUsd: estimateVideoCost(promptTokens, 1),
  });
  onProgress?.(100);
  return URL.createObjectURL(blob);
};
