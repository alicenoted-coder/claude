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
scraper/                     # 社群／電商資料擷取 CLI（與 web app 獨立）
├── cli.ts                   # 指令進入點：login / shopee / threads / instagram / facebook
├── browser.ts               # Playwright 真實瀏覽器 + 自動捲動
├── shopee.ts                # 蝦皮：帶 cookie 打內部 v4 JSON API
├── meta.ts                  # Threads / IG：攔截 GraphQL 回應 + 遞迴收割貼文
├── facebook.ts              # FB 粉專：DOM 盡力抽取
├── walk.ts                  # 遞迴掃 JSON、用「形狀」找目標物件
├── csv.ts                   # 三種 record 攤平成同一張 CSV（含 BOM）
└── types.ts                 # profile / product / post 共用型別
```

---

# 社群／電商資料擷取（scraper/）

抓 **蝦皮、Threads、Instagram、Facebook** 的公開頁面資訊（賣場/粉專基本資訊、商品名稱/價格/銷量、貼文內容/互動數），匯出成 CSV 做研究比對。

> ⚠️ **合規提醒**：自建爬蟲擷取他人頁面**違反各平台服務條款**，平台可能封鎖你的帳號/IP。請：① 僅抓公開、彙總、去識別化資料做研究；② 依台灣**個資法**，避免蒐集可識別個人的資料；③ 已內建禮貌限速，請勿大量高頻抓取。風險自負。

## 安裝

```bash
npm install
npx playwright install chromium    # 下載瀏覽器（約 150MB，需一次）
```

## 用法

```bash
# IG / FB 有登入牆，先手動登入存 session（會開出瀏覽器視窗，登入後回終端機按 Enter）
npm run scrape -- login instagram
npm run scrape -- login facebook

# 蝦皮賣場：基本資訊 + 商品（名稱/價格/銷量/評分/庫存）
npm run scrape -- shopee --shop <賣場username> --limit 100

# Threads / Instagram：個人檔案 + 貼文（內容/讚/留言/瀏覽）
npm run scrape -- threads --user <handle> --limit 30
npm run scrape -- instagram --user <handle>

# Facebook 粉專：粉專名稱 + 貼文（盡力）
npm run scrape -- facebook --page <粉專名>
```

共用選項：`--limit <n>`（預設 50）、`--out <path>`（預設 `data/<platform>-<目標>.csv`）、`--headful`（顯示瀏覽器除錯）、`--auth <path>`（指定 session 檔）。

## 各平台可靠度（誠實說明）

| 平台 | 方式 | 可靠度 | 備註 |
|------|------|--------|------|
| 蝦皮 | 真實瀏覽器帶 cookie 打內部 JSON API | 較高 | 欄位最全；蝦皮改 API 或加強人機驗證時需更新端點 |
| Threads | 攔截 GraphQL JSON + 遞迴收割 | 中 | 公開貼文多半拿得到；登入後更穩 |
| Instagram | 同上 | 中偏低 | 登入牆重，**強烈建議先 `login`** |
| Facebook | DOM 抽取 | 低 | 反爬最強、HTML 全亂數，務必先 `login`，結構一改就需調整選擇器 |

設計上刻意**用「資料形狀」遞迴尋找**（`walk.ts`）而非鎖死 HTML class / JSON 路徑，平台小改版時較不易整支壞掉；真正大改時，主要改 `shopee.ts` 的端點或 `facebook.ts` 的選擇器即可。

`data/`（輸出）與 `.auth/`（登入 session）已加入 `.gitignore`，**不會被 commit**。

---

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
