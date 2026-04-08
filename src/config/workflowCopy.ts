export const APP_NAME = 'GEM';
export const APP_FULL_NAME = 'Generative Engine for Motion';

export const GEM_STEPS = [
  { id: 1, path: '/step1', label: '故事發想與防呆' },
  { id: 2, path: '/step2', label: '提示詞轉譯與 HITL' },
  { id: 3, path: '/step3', label: '角色初生' },
  { id: 4, path: '/step4', label: '視角擴展與角色表' },
  { id: 5, path: '/step5', label: '場景純淨底圖' },
  { id: 6, path: '/step6', label: '視覺合成' },
  { id: 7, path: '/step7', label: '動態生成' },
  { id: 8, path: '/step-music', label: '音畫整合' },
] as const;

export const PROMO_STEPS = [
  { id: 1, path: '/step2a', label: '產品解構與腳本' },
  { id: 2, path: '/step3a', label: '視覺首尾影格生成' },
  { id: 3, path: '/step4a', label: '動態插幀' },
  { id: 4, path: '/step5a', label: '轉場縫合' },
  { id: 5, path: '/step-music', label: '音畫整合' },
] as const;

export const PROMO_STORY_STEPS = [
  { id: 1, path: '/promo-story/step1', label: '故事腳本與分鏡' },
  { id: 2, path: '/promo-story/step2', label: '角色設計' },
  { id: 3, path: '/promo-story/step3', label: '分鏡影格生成' },
  { id: 4, path: '/promo-story/step4', label: '影片生成' },
  { id: 5, path: '/step-music', label: '音畫整合' },
] as const;

export const LOBBY_COPY = {
  title: APP_NAME,
  subtitle: APP_FULL_NAME,
  description:
    '一套給內部團隊使用的 AI 影音工作流平台，從企劃、腳本、分鏡、圖片、影片、轉場到音樂，讓每個高成本節點都能保留人工確認與版本管理。',
  gemButton: 'INITIATE GEM WORKFLOW',
  gemCaption: '原創故事動畫流程',
  promoButton: 'INITIATE PROMO WORKFLOW',
  promoCaption: '產品廣告短影音流程',
} as const;

export const ADMIN_COPY = {
  title: 'API 用量監控儀表板',
  subtitle: '查看所有模型呼叫次數、Token 用量與預估成本。',
  calls: '總 API 呼叫次數',
  cost: '總預估成本',
  promptTokens: 'Prompt Tokens',
  outputTokens: 'Output Tokens',
  breakdown: '模型使用拆解',
  empty: '目前還沒有任何 API 使用紀錄。',
} as const;

export const API_KEY_COPY = {
  badge: 'Runtime API Key',
  title: 'API Key 設定',
  description:
    '在這裡輸入 Gemini API Key。金鑰只會儲存在目前瀏覽器的本地持久化儲存，不需要修改 .env。',
  inputLabel: 'Gemini API Key',
  placeholder: '請輸入 API Key，例如 AIza...',
  storageTitle: '本地持久化儲存',
  storageDescription:
    '這把金鑰會保存在目前瀏覽器中，之後重新進站仍可使用。你也可以隨時清除並換成新的 Key。',
  back: '返回大廳',
  save: '儲存 API Key',
  clear: '清除目前金鑰',
  saved: '已儲存，目前瀏覽器會優先使用這把 API Key。',
} as const;
