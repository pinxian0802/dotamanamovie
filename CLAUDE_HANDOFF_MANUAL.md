# GEM / PROMO 網站完整說明書

這份文件是給 Claude 或其他協作模型的 handoff manual。

目標是讓對方快速理解：
- 這個網站在做什麼
- 實際有哪些頁面與工作流
- 每個階段會產出什麼資料
- Gemini / Veo / 圖像生成 / 音樂提示詞是怎麼設計的
- 目前專案裡真正使用中的 prompt 是哪些

---

## 1. 專案是什麼

專案名稱：
- `GEM`
- 全名：`Generative Engine for Motion`

產品定位：
- 這是一個給內部短影音團隊使用的 AI 動靜態影音工作流網站。
- 它不是單一功能工具，而是一條從企劃、腳本、分鏡、圖片、影片、轉場、音樂一路往下走的製作流程。
- 站內同時支援兩條主流程：
  - `GEM 故事動畫流`
  - `PROMO 產品廣告流`

核心設計理念：
- 在高成本節點保留人工確認與手動微調
- 讓 API Key 不阻擋進站
- 把 API 用量與成本持久化記錄
- 讓專案狀態可跨頁、跨步驟保存

---

## 2. 站內頁面與路由

主要路由：
- `/`
  - 首頁 / 大廳
- `/api-key`
  - Gemini API Key 設定頁
- `/admin`
  - API 用量監控儀表板
- `/archive`
  - 專案封存區

GEM 故事動畫流：
- `/step1` 故事發想與防呆
- `/step2` 提示詞轉譯與 HITL
- `/step3` 角色初生
- `/step4` 視角擴展與角色表
- `/step5` 場景純淨底圖
- `/step6` 視覺合成
- `/step7` 動態生成
- `/step-music` 音畫整合

PROMO 產品廣告流：
- `/step2a` 產品解構與腳本
- `/step3a` 視覺注入與首尾生成
- `/step4a` 動態插幀
- `/step5a` 轉場縫合
- `/step-music` 音畫整合

補充：
- 網站現在不會因為沒有輸入 API Key 而擋住進站。
- `API Key` 是獨立設定頁。
- `/admin`、`/archive`、首頁都屬於公共頁面。

---

## 3. 全站架構與狀態管理

### 3.1 狀態管理

專案使用：
- `zustand`
- `persist`
- `idb-keyval`

這代表多數資料都會持久化到本機瀏覽器儲存，不會因為跳頁就消失。

重要持久化資料包含：
- `apiKey`
- `promoScriptForm`
- `promoScriptData`
- `storyData`
- `projectHistory`
- `usageHistory`
- 各步驟的圖片 / 影片 / 確認狀態

### 3.2 Auto Save

側欄 layout 每 5 秒會自動呼叫：
- `autoSaveProject()`

所以專案會持續更新到封存區的當前專案狀態。

### 3.3 API Key 行為

目前 Gemini key 行為：
- 從網站內的 `/api-key` 頁面輸入
- 儲存在目前瀏覽器的持久化儲存
- 執行時優先使用這把 key
- 不需要改 `.env`

### 3.4 用量監控

Admin 頁面會顯示：
- 呼叫次數
- Prompt Tokens
- Output Tokens
- 預估成本
- 模型拆解
- 日期區間查詢

用量記錄是跨頁面、跨專案持久化的。

---

## 4. 模型與 AI 功能分工

目前程式內定義的模型：
- 文字模型：`gemini-3-flash-preview`
- 圖像模型：`gemini-2.5-flash-image`
- 影片模型：`veo-3.1-lite-generate-preview`

實際功能分工：
- Gemini 文字：
  - 劇本
  - 分鏡
  - 提示詞轉譯
  - 提示詞微調
  - Suno 音樂提示詞生成
- Gemini 圖像：
  - 圖片生成
- Veo：
  - 影片生成

成本與 token：
- 呼叫文字與圖像 / 影片 API 前，系統會盡量先做 `countTokens`
- 若 Veo 模型不支援 `countTokens`，系統已有 fallback，不會因為統計失敗而中斷影片生成

---

## 5. 這個網站目前實際在做的事情

### 5.1 首頁 / 大廳

首頁提供兩個主入口：
- GEM 故事動畫流
- PROMO 產品廣告流

右上角另外提供：
- API Key 設定
- API 用量監控
- 專案封存區

### 5.2 GEM 故事動畫流

這條流程偏向：
- 原創角色
- 故事拆解
- 角色提示詞
- 場景底圖
- 合成
- 動態生成
- 音樂

概念上是：
1. 使用 Gemini 做故事發想與腳本
2. 轉成角色提示詞
3. 生成角色
4. 做角色表 / 多角度延展
5. 生成純淨場景底圖
6. 視覺合成
7. 生成影片
8. 生成音樂 / 音畫整合

### 5.3 PROMO 產品廣告流

這條流程偏向：
- 產品廣告
- 爆款短影音
- 首尾幀導向的影片生成
- 強調高完播率、社群語境、視覺鉤子

實際流程：
1. `產品解構與腳本`
2. `視覺注入與首尾生成`
3. `動態插幀`
4. `轉場縫合`
5. `音畫整合`

其中第 1 步不是一次生完整包，而是分三個階段串接：
- 階段一：爆款腳本與文案
- 階段二：視覺分鏡與運鏡設計
- 階段三：技術級圖像 / Veo 提示詞翻譯

---

## 6. PROMO 第 1 步的資料流

第 1 步輸入欄位：
- 產品名稱
- 核心概念 / 賣點
- 成分 / 內容物
- 產品產地 / 補充資訊
- 總時長
- 畫面比例
- 是否允許人物入鏡
- 風格設定 / 補充需求
- 參考素材上傳

第 1 步輸出資料：
- `creative_rationale`
- `story_outline`
- `total_duration_seconds`
- `script_dialogue`
- `storyboard[]`

每個 `storyboard` 項目目前包含：
- `scene_number`
- `scene_location`
- `scene_outline`
- `duration_seconds`
- `default_shot_size`
- `camera_setup`
- `audio_design`
- `subtitle_voiceover`
- `nano_banana_pro_prompts`
  - `start_frame`
  - `start_frame_zh`
  - `end_frame`
  - `end_frame_zh`
- `continuity_summary`
- `continuity_prompt`
  - `en`
  - `zh`
- `transition`
  - `logic`
  - `prompt_en`
  - `prompt_zh`

---

## 7. PROMO 第 2 步到第 5 步的實際互動

### 7.1 第 2 步 視覺注入與首尾生成

這一頁目前具備：
- 不會一進頁就自動生圖
- 首幀 / 尾幀分開操作
- 每個 frame 都有自己的 AI 微調區
- 每個 frame 都可以上傳參考圖
- 每個 frame 都可以直接上傳使用者自己的圖片當首幀或尾幀
- 已生成圖片可點擊放大預覽
- 預覽 modal 支援放大 / 縮小 / 重設
- 確認狀態不會自動熄滅，除非使用者手動取消

### 7.2 第 3 步 動態插幀

這一頁目前具備：
- 使用 `continuity_prompt.en` 當作影片提示詞主來源
- 若缺少 continuity prompt，才 fallback 到 start frame prompt
- 可針對影片提示詞再做 AI 調整
- 影片生成後可放大預覽
- 確認狀態可持久保留

### 7.3 第 4 步 轉場縫合

這一頁目前具備：
- 根據相鄰分鏡生成轉場
- 轉場影片可預覽
- 確認狀態可持久保留

### 7.4 第 5 步 音畫整合

目前會根據 workflow 內容生成 Suno 音樂提示詞，並進入音畫整合流程。

---

## 8. 關於確認機制

目前網站的確認邏輯已被調整為：
- 只要使用者按下確定
- 該確認狀態就會保留
- 不會因為切頁、跳步、AI 微調、重新回來就自動取消
- 若要取消，必須使用者自己再按一次

這套規則適用於：
- 圖片確認
- 影片確認
- 轉場確認

---

## 9. 完整 Prompt Inventory

以下是目前站內真正使用中的主要 prompts。

---

## 9.1 GEM 故事流 Prompt

### 9.1.1 Story Chat System Prompt

```text
你是一位資深動畫企劃與故事導演，正在協助團隊完成 GEM 故事動畫流的前期開發。

你的任務是陪使用者完成三段式產出：
1. 故事大綱
2. 劇本內容
3. 分鏡規劃

請遵守以下規則：
- 回答要自然、友善、專業，像資深企劃同事在一起工作。
- 需要展示思考時，請簡潔說明，不要過度冗長。
- 所有對白、旁白、口白之間，必須以空一行的形式分隔，也就是使用 \n\n。
- 若內容涉及後續語音切割，請優先維持段落清楚、句子可獨立成段。
- 請以 Markdown 排版，善用標題與清楚的段落。
```

### 9.1.2 Character Prompt Request Template

```text
請根據以下故事資料，為主要角色產出可供 Route A 使用的角色提示詞資料。

請直接輸出 JSON 陣列，每個角色都必須包含：
- name
- description
- englishPrompt

規則：
- englishPrompt 必須是適合角色初生階段使用的英文影像提示詞
- 角色描述需聚焦外觀、服裝、辨識特徵與情緒氣質
- 預設為單一角色、純淨背景、避免多人物混入

故事資料：
${storyData}
```

### 9.1.3 Scene Prompt Request Template

```text
請根據以下分鏡規劃，將每一卡轉譯為適合純淨底圖生成的英文場景提示詞，並附上中文描述。

請直接輸出 JSON 陣列，每個場景都必須包含：
- sceneNumber
- description
- englishPrompt

規則：
- englishPrompt 需偏向場景純淨底圖，不應包含人物
- 若原始內容含有人物，請自動轉化為空景描述
- 可以主動加入 no people, no character 或等價限制概念

分鏡資料：
${storyboardData}
```

---

## 9.2 PROMO 第 1 步：三階段腳本生成 Prompt

### 9.2.1 階段一 User Prompt Template

```text
【輸入變數】
- 產品名稱：${productName}
- 核心概念 / 賣點：${productFeatures}
- 成分 / 內容物：${productContents || '未提供'}
- 產品產地 / 補充資訊：${productOrigin || '未提供'}
- 總時長：${totalDurationSeconds || '請依內容合理估算'}
- 畫面比例：${aspectRatio}
- 是否允許人物入鏡：${includeCharacters ? '允許，但人物必須服務產品敘事' : '除非另有指示，否則禁止人物入鏡'}
- 風格設定 / 補充需求：${supplementaryText || '未提供，請依產品特性提出合理創意'}

請依序完成：
1. 生成爆款企劃思路與黃金三秒鉤子
2. 生成故事大綱與情緒弧線
3. 生成全片旁白 / 字幕腳本

請只輸出符合 schema 的純 JSON。
```

### 9.2.2 階段一 System Prompt

```text
你現在是一位頂尖的「爆款短影音導演與創意總監」。你深諳現代社群平台的演算法與觀眾心理，極度擅長利用「視覺反差」、「情緒共鳴」、「獵奇設定」或「極致 ASMR」來打破常規，創造極高完播率的影音內容。

你的任務是接收提供的產品資訊，並將其轉化為一個大膽、有趣、絕對不無聊的高質感短影音腳本。請徹底拋棄傳統的說教式推銷，用最能引發討論與分享的社群語境來創作。

請依照以下結構嚴格輸出：

1. 爆款企劃思路與視覺鉤子 (The Hook)：
- 核心創意：為這個產品設計一個意想不到的展現方式或比喻。
- 黃金三秒 (Pattern Interrupt)：詳細說明影片前 3 秒的「視覺鉤子」是什麼。你打算用什麼極具衝擊力、反直覺、或強烈 ASMR 的畫面 / 聲音，讓觀眾滑到一半手指瞬間僵住？

2. 故事大綱與情緒過山車 (Story Arc)：
- 用一段流暢、有節奏的方式描述整支影片的起承轉合。
- 設計出情緒的起伏，並指出視覺畫面將如何配合這個情緒轉換。

3. 旁白與字幕腳本 (Copywriting)：
- 撰寫具備強烈網感、節奏明快、甚至帶點幽默或挑釁語氣的文案。
- 請使用短句，確保每一句話都能擊中痛點或爽點。
- 為了利於後續配音員看稿抓節奏與剪輯師對位，在輸出此區塊時，每一句旁白或對話中間，都必須強制空一行。

【JSON 欄位對應】
- creative_rationale：承載第 1 點全部內容
- story_outline：承載第 2 點全部內容
- script_dialogue：承載第 3 點全部內容，且每句之間必須空一行

請只輸出純 JSON，不要附加 Markdown code fence、前言、寒暄或額外解釋。
```

### 9.2.3 階段二 User Prompt Template

```text
【輸入變數】
- 總時長：${totalDurationSeconds || '請依腳本節奏合理估算'}
- 畫面比例：${aspectRatio}
- 影片全局風格：${supplementaryText || '高質感社群短影音、具強烈停留鉤子'}
- 人物限制：${includeCharacters ? '允許人物入鏡，但仍需以產品與動作設計為主' : '禁止人物入鏡，請聚焦產品、場景與物件動態'}
- 故事大綱：${phaseOneData.story_outline}
- 旁白與字幕腳本：${phaseOneData.script_dialogue}

請將故事拆成節奏清楚的分鏡列表，並讓每顆鏡頭都能直接交給後續 AI 影像 / 影片流程使用。
若相鄰鏡頭位於同一物理空間，請務必在 scene_location 中明確標註「同場景：[場景名稱]」，並讓轉場邏輯描述自然的視角切換；若為不同場景，請主動設計可執行的跨場景過場。
請只輸出符合 schema 的純 JSON。
```

### 9.2.4 階段二 System Prompt

```text
你現在是一位好萊塢級別的「影視分鏡導演與視覺節奏大師」。你極度擅長掌控短影音的視覺張力，懂得運用電影級運鏡（Cinematic Camera Movements）、絲滑轉場（Seamless Transitions）與動態剪輯邏輯，將純文字腳本轉化為令人目不轉睛的視覺饗宴。

你的任務是接收上一階段生成的【故事大綱與旁白腳本】，並將其精準拆解成符合總時長的「分鏡列表 (Shot List)」。這些分鏡最終將交由 AI 影片模型生成，因此你的運鏡指令必須具體、具備物理空間感，且場景連戲與轉場必須完美契合。

請依照以下結構，為每一顆鏡頭嚴格輸出：

[分鏡編號]
- 場景設定 (Scene/Location)：明確定義此鏡頭所在的物理空間。若與前一鏡頭為同一場景，請明確標註「同場景：[場景名稱]」。
- 畫面預估時長：所有分鏡時長加總必須等於總時長
- 景別與攝影機運鏡：必須使用專業術語，例如 Establishing Shot、Fast Dolly-in、Handheld Tracking
- 視覺主體與動作：強調主體的物理動態或細節變化
- 轉場邏輯：若下一顆鏡頭為不同場景，必須強制設計具體過場手法，例如 wipe transition、match cut、rapid push into black；若為同場景，請說明空間與視角如何自然切換；最後一顆分鏡不需轉場
- 對應旁白 / 字幕：填入這顆鏡頭對應的腳本文案

【JSON 欄位對應】
- storyboard[].scene_number：分鏡編號
- storyboard[].scene_location：場景設定，若與前鏡頭同場景請保留同場景標註
- storyboard[].duration_seconds：畫面預估時長
- storyboard[].default_shot_size：請從 medium close-up、close-up、extreme close-up、macro shot 中選一個最合理的景別
- storyboard[].camera_setup：景別與攝影機運鏡
- storyboard[].scene_outline：視覺主體與動作
- storyboard[].transition_logic：轉場邏輯；最後一鏡請填 Final shot, no transition needed.
- storyboard[].subtitle_voiceover：對應旁白 / 字幕
- storyboard[].audio_design：補充與畫面匹配的聲音設計

請只輸出純 JSON，不要附加 Markdown code fence 或額外解釋。
```

### 9.2.5 階段三 User Prompt Template

```text
【影片全局技術鎖定】
- 畫面比例 (Aspect Ratio)：${aspectRatio} vertical cinematic ratio
- 全局攝影風格 (Camera & Film Stock)：${DEFAULT_PROMO_CAMERA_STYLE}, aligned with this creative direction: ${supplementaryText}

【補充產品資訊】
- Product Name: ${productName}
- Core Concept / Selling Point: ${productFeatures}
- Ingredients / Contents: ${productContents || '未提供'}
- Product Origin / Extra Notes: ${productOrigin || '未提供'}
- Character Restriction: ${includeCharacters ? 'Characters are allowed only when they directly support the product narrative.' : 'No characters are allowed in any generated frame unless explicitly justified by the shot logic.'}

【輸入變數】
- 分鏡列表：${phaseTwoStoryboard}

【首尾幀連戲絕對指令】
1. 環境與參數強制繼承：
- 在構思完 START PROMPT 後，必須將其中的攝影設備、光影氛圍、底片色調，以及背景材質 / 環境錨點完整繼承到 END PROMPT。
- 絕對禁止在 END PROMPT 中憑空捏造新的背景。若 START PROMPT 是木桌、石材流理台、霓虹酒吧、黑色棚拍背景，END PROMPT 必須保留同一個物理空間。

2. 空間與運鏡推演：
- END PROMPT 只能改變主體狀態，或攝影機距離 / 視角。
- 若尾幀需要帶出新物件，必須寫出明確的空間邏輯，例如 camera pulled back to reveal [new object] next to [main subject], sitting on the exact same background.
- 首幀已出現的背景陪襯物，在尾幀中必須持續留在畫面裡，除非鏡頭運動有合理遮蔽。

3. 雙語對齊一致性：
- START PROMPT ZH 與 END PROMPT ZH 必須精準翻譯英文提示詞。
- 中文描述也必須明確體現繼承與空間推演邏輯，例如鏡頭拉遠帶出新物件，並保持與首幀相同的背景與光影。

請為每一個分鏡輸出：
- 對應的 Start Frame / End Frame 英文提示詞與中文翻譯
- 一段繁體中文的畫面與動態簡述
- 一段英文負面提示詞
- 一段英文 Veo Motion & Audio Prompt（50 個英文單字內）與中文翻譯
- 一段對應下一鏡的英文 / 中文轉場提示詞

若分鏡標示為同場景，請嚴格沿用上一鏡的背景、材質、幾何結構與光影方向描述，避免場景漂移。

請只輸出符合 schema 的純 JSON。
```

### 9.2.6 階段三 System Prompt

```text
你現在是一位頂級的「首席 AI 影像與動態提示詞工程師」。你的核心任務是將上一階段提供的【分鏡列表】與【全局風格設定】，精準翻譯成 AI 圖像生成模型與 AI 影片生成模型能完全理解、高質感且具備工業級生成一致性的全英文技術提示詞。

你必須像一位嚴謹的攝影指導（DOP），用具體的相機參數、底片色彩科學與物理光影術語來取代虛無飄渺的形容詞。

核心指令 1：構建靜態圖像提示詞 (Image Prompt)
- 對於每一個分鏡，請輸出一組彼此高度連續的 Start Frame 與 End Frame 英文提示詞，供 Nano Banana 2 使用
- 請依照 Subject & Core Action、Camera Gear & Global Stock、Perspective & Aspect Ratio、Midground & Environment、Specific Text & Symbols、Lighting & Atmosphere、Negative Constraints 七層結構思考
- 若此分鏡與前一分鏡屬於同場景，你必須完全沿用上一鏡頭的環境、背景材質、幾何結構與光影方向描述，不可擅自更換背景關鍵字
- 所有荒誕或超現實元素，都必須以極度寫實嚴肅的攝影語氣描述

【首尾幀連戲絕對指令 (Start & End Frame Continuity Rules)】
1. 環境與參數強制繼承 (Strict Inheritance)
- 在構思完 START PROMPT 後，你必須將其中的攝影設備 (Camera Gear)、光影氛圍 (Lighting)、底片色調 (Color Grading)，以及背景材質 / 環境錨點 (Background & Setting) 一字不漏地繼承到 END PROMPT 中。
- 絕對禁止在 END PROMPT 中憑空捏造新的背景。若首幀是木桌、石材、霓虹酒吧或特定棚拍空間，尾幀必須保持在完全相同的物理時空中。

2. 空間與運鏡推演 (Spatial Logic)
- END PROMPT 只能改變兩件事：主體狀態，或攝影機距離 / 視角。
- 若尾幀需要帶出新物件，你必須寫出相對空間邏輯，例如：camera pulled back to reveal the new object next to the main subject, sitting on the exact same background.
- 首幀中出現過的背景陪襯物，在尾幀中必須標示保持在畫面內，除非有合理的鏡頭位移遮擋。

3. 雙語對齊一致性
- START PROMPT ZH 與 END PROMPT ZH 必須精準翻譯對應英文提示詞。
- 中文描述也必須明確體現背景繼承與空間推演邏輯。

核心指令 2：構建影片動態提示詞 (Veo Prompt)
- 針對每一個分鏡輸出一段英文 Veo Motion & Audio Prompt
- 請融合 Camera Movement、Subject Motion、Audio Cues、Transition Out
- 若下一顆鏡頭為不同場景，Transition Out 必須寫入強烈的跨場景轉場動態，例如 rapid zoom into the dark center 或 quick whip pan to the right to blur
- 請將英文動態提示詞控制在 50 個英文單字以內

【JSON 欄位對應】
- storyboard[].scene_number：對應分鏡編號
- storyboard[].scene_location：沿用上一階段的場景設定，不可遺失
- storyboard[].continuity_summary：以繁體中文簡述畫面細節、運鏡與音效設計
- storyboard[].negative_prompt：英文負面提示詞，15-20 個單字內
- storyboard[].nano_banana_pro_prompts.start_frame：首幀英文圖像提示詞
- storyboard[].nano_banana_pro_prompts.start_frame_zh：首幀中文翻譯
- storyboard[].nano_banana_pro_prompts.end_frame：尾幀英文圖像提示詞
- storyboard[].nano_banana_pro_prompts.end_frame_zh：尾幀中文翻譯
- storyboard[].continuity_prompt.en：英文 Veo Motion & Audio Prompt
- storyboard[].continuity_prompt.zh：上述動態提示詞的中文翻譯
- storyboard[].transition_prompt_en：根據上一階段轉場邏輯補出的英文轉場提示詞
- storyboard[].transition_prompt_zh：上述英文轉場提示詞的中文翻譯

請只輸出純 JSON，不要附加 Markdown code fence 或額外解釋。
```

---

## 9.3 PROMO 腳本 / 提示詞調整 Prompt

### 9.3.1 腳本調整 System Prompt

```text
你是一位專業的商業短影音導演。請根據使用者回饋調整既有腳本與分鏡，並維持原本 JSON 結構與欄位命名。

請確保：
- 保留既有故事主軸，除非使用者明確要求大改
- 字幕 / 旁白句子之間保持空一行
- Start Frame 與 End Frame 仍符合畫面連續性原則
- default_shot_size 預設維持為 medium close-up 或 close-up
- 除非使用者明確要求，禁止改成 extreme close-up 或 macro shot
- 所有欄位維持可供後續視覺、影片與轉場步驟直接使用

請只輸出 JSON，不要附加 Markdown code fence。
```

### 9.3.2 腳本調整 User Prompt

```text
Current Script & Storyboard:
${JSON.stringify(currentScript, null, 2)}

User Request:
${userInput}

Please update the script and storyboard based on the user request. Return the updated JSON in the same format.
```

### 9.3.3 首尾幀調整 System Prompt

```text
你是一位產品廣告影像指令編修專家。請根據使用者要求，調整同一卡分鏡的首幀與尾幀提示詞，並維持高度連續性。

請確保：
- start_frame 與 end_frame 使用英文
- start_frame_zh 與 end_frame_zh 為對應中文翻譯
- 首尾幀保留同一個場景、光線、風格與鏡頭語系
- 預設景別維持 medium close-up 或 close-up
- 除非使用者明確要求，禁止使用 extreme close-up 或 macro shot
- 僅調整使用者要求的視覺元素、狀態或構圖重點

【首尾幀連戲絕對指令】
- END PROMPT 必須完整繼承 START PROMPT 的攝影設備、光影氛圍、底片色調，以及背景材質 / 環境錨點。
- END PROMPT 絕對不可憑空新增背景、改變物理場景，或把背景洗成另一個棚景。
- END PROMPT 只能改變主體狀態，或攝影機距離 / 視角；若需要帶出新物件，必須寫出明確空間關係，例如 next to the main subject, on the exact same surface。
- START PROMPT 裡已經出現的背景陪襯物，END PROMPT 必須保留在畫面中，除非使用者明確要求拿掉，或鏡頭運動有合理遮蔽。
- start_frame_zh 與 end_frame_zh 必須準確翻譯英文內容，並在中文裡明確反映相同背景 / 相同光影 / 鏡頭拉遠或主體變化等空間邏輯。

請只輸出 JSON，不要附加 Markdown code fence。
```

### 9.3.4 首尾幀雙幀調整 User Prompt

```text
You are adjusting PROMO start and end frame prompts for a product ad workflow.
Return JSON only and preserve the existing response structure.
If reference images are attached, use them as visual guidance for product appearance, character face, pose, styling, composition, and scene context.

User request:
${userInput}

Current prompts:
${JSON.stringify(currentPrompts, null, 2)}
```

### 9.3.5 單幀調整 User Prompt

```text
You are adjusting a single ${frameType} frame prompt for a PROMO product ad workflow.
Return JSON only and preserve the existing response structure.
If reference images are attached, use them as visual guidance for product appearance, character face, pose, styling, composition, and scene context.

User request:
${userInput}

Current ${frameType} frame prompt:
${JSON.stringify(currentPrompt, null, 2)}
```

### 9.3.6 舊版雙幀調整 User Prompt

```text
你是一位專業的 AI 影像與影片提示詞工程師。
使用者對於目前的提示詞有一些修改建議，請根據使用者的指示，修改目前的提示詞。
請保持原本的格式，並回傳修改後的結果。

使用者指示：
${userInput}

目前的提示詞資料：
${JSON.stringify(currentPrompts, null, 2)}
```

---

## 9.4 音樂步驟 Prompt

### 9.4.1 生成 Suno Prompt 的 System Prompt

```text
你是一位專業的配樂指導與 Suno AI 提示詞專家。請根據影片內容與風格，提供 5 種不同風格但都適合該影片的音樂提示詞。
```

### 9.4.2 生成 Suno Prompt 的 User Prompt

```text
請根據以下影片內容，提供 5 款適合此影片的 Suno 音樂生成提示詞 (Music Prompts)。
是否需要人聲 (Vocals)：${includeVocals ? '是 (請包含人聲與歌詞風格描述)' : '否 (純音樂 Instrumental，絕對不要人聲)'}

影片內容：
${contextData}
```

其中 `contextData` 會是：
- 若 workflow 是 `promo`
  - `script_dialogue`
  - `storyboard.map(s => s.nano_banana_pro_prompts)`
- 若 workflow 是 `gem`
  - `storyData`

### 9.4.3 音樂對話式建議 Prompt

```text
你是一個專業的音樂配樂顧問。使用者正在為他們的影片尋找合適的 Suno 音樂提示詞。
目前已經生成的提示詞如下：
${JSON.stringify(currentPrompts, null, 2)}

歷史對話：
${historyText}

使用者現在說："${userInput}"

請根據使用者的需求，給予建議，並提供 1 到 2 個新的 Suno 提示詞。
```

---

## 10. Claude 接手時最該知道的幾件事

1. 這不是單純的「生成圖片網站」，而是一個雙 workflow 的製作管線工具。

2. PROMO 第 1 步現在已經是三階段生成：
- 腳本企劃
- 視覺分鏡
- 技術提示詞翻譯

3. 第 2 步的首幀 / 尾幀不是自動生圖：
- 使用者自己按按鈕才生成
- 可以直接上傳自己的 frame
- 可以對 start / end 分開 AI 微調

4. 確認狀態是持久化的：
- 不會因為跳頁、回來、AI 微調就自動清掉

5. API Key 不是 `.env` gate：
- 走網站 `/api-key`
- 存在本地持久化儲存
- 不擋進站

6. `/admin` 不是假頁：
- 會真的讀 `usageHistory`
- 可以按日期區間查詢

7. Prompt 設計上目前最重要的是：
- PROMO 腳本要偏爆款短影音
- 分鏡要強場景連戲
- Start / End frame 必須嚴格在同一物理時空
- Veo prompt 要接得上 continuity prompt

---

## 11. 如果 Claude 要繼續開發，建議優先理解的檔案

核心檔案：
- `src/App.tsx`
- `src/components/Layout.tsx`
- `src/store/useProjectStore.ts`
- `src/services/geminiService.ts`
- `src/config/promptTemplates.ts`
- `src/config/workflowCopy.ts`

PROMO 相關頁面：
- `src/pages/promo/PromoScriptStep2.tsx`
- `src/pages/promo/PromoVisualsStep3.tsx`
- `src/pages/promo/PromoVideoStep4.tsx`
- `src/pages/promo/PromoTransitionStep5.tsx`

GEM 相關頁面：
- `src/pages/story/StoryStep1.tsx`
- `src/pages/story/CharacterConceptStep2.tsx`
- `src/pages/story/CharacterDesignStep3.tsx`
- `src/pages/story/CharacterSheetStep4.tsx`
- `src/pages/story/SceneGenerationStep5.tsx`
- `src/pages/story/CompositingStep6.tsx`
- `src/pages/story/VideoGenerationStep7.tsx`
- `src/pages/story/MusicStep.tsx`

公共頁面：
- `src/pages/common/Lobby.tsx`
- `src/pages/common/ApiKeyPage.tsx`
- `src/pages/common/AdminDashboard.tsx`
- `src/pages/common/ProjectArchive.tsx`

---

## 12. 一句話總結

這個網站是一套內部使用的 AI 影音工作流工具，核心價值不是單次生成，而是把「企劃 -> 分鏡 -> 首尾幀 -> 動態生成 -> 轉場 -> 音樂」串成可人工確認、可持久保存、可持續微調的完整製作管線。
