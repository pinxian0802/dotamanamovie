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
  { id: 2, path: '/step3a', label: '視覺注入與首尾生成' },
  { id: 3, path: '/step4a', label: '動態插幀' },
  { id: 4, path: '/step5a', label: '轉場縫合' },
  { id: 5, path: '/step-music', label: '音畫整合' },
] as const;

export const LOBBY_COPY = {
  title: APP_NAME,
  subtitle: APP_FULL_NAME,
  description:
    '一套給內部短影音團隊使用的 AI 動靜態影音工作流。你可以走原創故事動畫流，也可以走商業產品廣告流，在每個高成本節點都保留人工確認與微調空間。',
  gemButton: 'INITIATE GEM WORKFLOW',
  gemCaption: '啟動故事動畫生成流',
  promoButton: 'INITIATE PROMO WORKFLOW',
  promoCaption: '啟動產品廣告生成流',
} as const;

export const ADMIN_COPY = {
  title: 'API 用量監控儀表板',
  subtitle: '跨頁面與跨專案持久化記錄，並支援日期區間查詢。',
  calls: '查詢區間 API 呼叫次數',
  cost: '查詢區間預估成本',
  promptTokens: 'Prompt Tokens',
  outputTokens: 'Output Tokens',
  breakdown: '模型用量拆解',
  empty: '所選日期區間內尚無用量紀錄。',
} as const;

export const API_KEY_COPY = {
  badge: 'Runtime API Key',
  title: 'API Key 設定',
  description:
    '在這裡輸入或替換 Gemini API Key。此設定頁只負責管理金鑰，不會阻擋你進入網站其他頁面。',
  inputLabel: 'Gemini API Key',
  placeholder: '貼上你的 API Key，例如 AIza...',
  storageTitle: '儲存在目前瀏覽器',
  storageDescription:
    '這把金鑰會保存在本機瀏覽器的持久化儲存中，供網站執行時使用，不需要回頭修改 .env。',
  back: '返回首頁',
  save: '儲存 API Key',
  clear: '清除已儲存 Key',
  saved: '已儲存，之後會優先使用這把 Key。',
} as const;
