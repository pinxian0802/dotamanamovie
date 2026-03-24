# 修改歷史紀錄 (Changelog)

這份文件用於記錄我們在開發過程中進行的各項修改與優化，方便後續回查與追蹤。

## 2026-03-17

### 1. 修正歷史專案庫 (ProjectArchive) 點擊閃退/返回主頁問題
- **問題描述**：使用者在「歷史專案庫」點擊歷史紀錄時，會被導向主頁 (`/`)，無法回到對應的生成流對話框。
- **修正內容**：
  - 修改了 `src/pages/common/ProjectArchive.tsx` 中的點擊事件處理邏輯。
  - 新增 `handleLoadProject` 函式，在載入專案 (`loadProject`) 後，根據專案的 `workflowType` (工作流類型：`gem` 或 `promo`) 以及 `currentStep` (當前步驟)，自動導向對應的路由 (例如 `/step1`, `/step3a`, `/step-music` 等)。
  - 修正了卡片邊框顏色的判斷邏輯，將 `project.workflowType` 改為 `project.state?.workflowType`，確保能正確讀取狀態。

### 2. 廣告生成流 (Promo Workflow) 排版與 UI 優化
- **問題描述**：廣告生成流的「步驟 2：產品視覺注入與首尾影格」與「步驟 3：動態插幀與影片生成」排版與「步驟 4：AI 轉場縫合生成」不一致。
- **修正內容**：
  - 修改 `src/pages/promo/PromoVisualsStep3.tsx` 與 `src/pages/promo/PromoVideoStep4.tsx`。
  - 將整體工作區域置中 (`max-w-4xl mx-auto`)。
  - 將網格排版 (`grid`) 改為橫向彈性排版 (`flex-col lg:flex-row`)。
  - 統一縮圖大小為 `w-40 aspect-[9/16]`，並讓提示詞文字方塊與縮圖置中對齊。

### 3. 廣告生成流 (Promo Workflow) 錯誤處理機制優化
- **問題描述**：API 配額用盡時 (`429 RESOURCE_EXHAUSTED`)，系統沒有給予明確的提示。
- **修正內容**：
  - 在 `PromoScriptStep2`, `PromoVisualsStep3`, `PromoVideoStep4`, `PromoTransitionStep5` 中加入了 `errorMsg` 狀態。
  - 捕捉 API 錯誤時，若包含 `429` 或 `RESOURCE_EXHAUSTED`，會在畫面上方顯示紅色的錯誤提示框：「API 配額已用盡，請檢查您的計費方案或稍後再試。」。

### 4. UI 標籤全面中文化
- **問題描述**：部分 UI 標題與標籤仍為英文。
- **修正內容**：
  - 將 `CharacterSheetStep4.tsx`, `MusicStep.tsx`, `PromoScriptStep2.tsx`, `PromoVisualsStep3.tsx`, `PromoVideoStep4.tsx`, `PromoTransitionStep5.tsx` 中的英文標籤（如 Start Frame, End Frame, Variation 等）全面翻譯為中文。
  - 修正了 `PromoTransitionStep5.tsx` 中導向不存在路徑 `/step8` 的錯誤，改為正確導向 `/step-music`。

### 5. 修正 API 429 錯誤捕捉機制
- **問題描述**：當 Gemini API 回傳 429 Quota Exceeded 錯誤時，由於錯誤物件的結構問題，原本的 `error.message` 判斷方式無法正確捕捉到錯誤，導致畫面上沒有顯示「API 配額已用盡」的提示。
- **修正內容**：
  - 在所有呼叫 API 的檔案中（包含 `PromoScriptStep2`, `PromoVisualsStep3`, `PromoVideoStep4`, `PromoTransitionStep5`, `StoryStep1`, `CharacterConceptStep2`, `CharacterDesignStep3`, `CharacterSheetStep4`, `SceneGenerationStep5`, `MusicStep`），修改了 `catch` 區塊的錯誤判斷邏輯。
  - 改為使用 `const errorString = error?.message || JSON.stringify(error) || '';` 將錯誤物件轉為字串後，再判斷是否包含 `429` 或 `RESOURCE_EXHAUSTED`，確保能正確攔截並顯示對應的錯誤訊息給使用者。
  - 在呼叫後端 API (`/api/gemini/...`) 的地方，加入了 `if (!response.ok)` 時解析回傳 JSON 錯誤訊息的邏輯。
