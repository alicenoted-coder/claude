# Photo AI Recognition Demo

驗證「批次拍照 → AI 自動辨識物品生成清單」技術可行性的網頁 demo。

- **框架**：Next.js 15（App Router）+ TypeScript + Tailwind CSS v4
- **AI**：Google Gemini `gemini-2.5-flash`（Vision，JSON 結構化輸出）
- **部署目標**：Vercel

## 功能

1. 一次選多張照片（手機可開相機、桌機可選檔案）
2. 上傳後顯示縮圖預覽，可逐張移除或全部清除
3. 「開始辨識」按鈕：每張照片並行送一次 Gemini 呼叫
4. 客戶端先壓縮（最長邊 1280px、JPEG 0.8）再上傳，避免手機原圖過大
5. Gemini 以 JSON Schema 強制回傳 `{ items: [{ name, category, confidence }] }`
6. 合併清單依 `category` 分組顯示，每筆標示來源照片與信心度

## 取得 Gemini API Key

1. 開啟 [Google AI Studio](https://aistudio.google.com/app/apikey)。
2. 用 Google 帳號登入，點 **Create API Key**，複製產出的字串。
3. 該 key 對 `gemini-2.5-flash` 有免費額度，足以測試。

## 本機跑起來

```bash
# 1. 安裝依賴
npm install

# 2. 設定環境變數
cp .env.example .env.local
# 編輯 .env.local，把 GEMINI_API_KEY 填上剛才產生的值

# 3. 啟動 dev server
npm run dev
```

打開 http://localhost:3000 即可使用。

> 環境變數只在 server 端讀取（`app/api/recognize/route.ts`），不會暴露到瀏覽器。

## 部署到 Vercel

### 方法 A：CLI

```bash
npm i -g vercel
vercel              # 第一次會詢問 link / new project
vercel env add GEMINI_API_KEY     # 貼上 API key（針對 production / preview / development 各加一次或選 all）
vercel --prod
```

### 方法 B：從 GitHub 匯入

1. 把這個 repo push 到 GitHub。
2. 到 [vercel.com/new](https://vercel.com/new) 匯入該 repo。
3. 在 **Environment Variables** 區塊新增：
   - Name：`GEMINI_API_KEY`
   - Value：你的 key
   - 套用到 Production / Preview / Development。
4. 按 Deploy。

之後每次 push 都會自動部署。

## 專案結構

```
app/
├── api/recognize/route.ts   # Gemini 呼叫，僅伺服器端讀 GEMINI_API_KEY
├── globals.css              # Tailwind v4 入口
├── layout.tsx
└── page.tsx                 # 主畫面：上傳 / 預覽 / 辨識 / 合併清單
lib/
├── compress.ts              # 客戶端 resize + JPEG 壓縮 + base64
└── types.ts                 # 共用型別
```

## 設計取捨

- **每張照片一次呼叫，並行送**：錯誤可單張處理、可顯示每張進度，比批次合併單一呼叫好除錯。
- **客端壓縮再 base64**：手機原圖常 5–10 MB，直送會撞 Vercel body 限制與拖慢回應。
- **JSON Schema 強制回傳格式**：用 Gemini 的 `responseSchema`，免去 prompt-engineering 解析失敗風險。
- **依 category 分組、組內保留每筆**：呈現「清單」直覺；同物品出現多張照片不去重，因為來源資訊本身有用。

## 可能的下一步

- 編輯 / 刪除清單項目、匯出 CSV
- 同名物品自動聚合計數（目前刻意不做）
- 改成單一呼叫多圖以省 token
- 加上拖曳上傳、PWA 離線快取

## 疑難排解

- **`GEMINI_API_KEY is not configured`**：`.env.local` 沒填或 dev server 沒重啟。
- **圖片太大上傳失敗**：壓縮在 `lib/compress.ts`，可調整 `MAX_DIMENSION` / `JPEG_QUALITY`。
- **Vercel 上 504**：`gemini-2.5-flash` 通常 < 10s 回應；若批次太多，可在 `recognizeAll` 加 concurrency 限制。
- **辨識結果偏籠統**：在 `app/api/recognize/route.ts` 的 `PROMPT` 加更多範例。
