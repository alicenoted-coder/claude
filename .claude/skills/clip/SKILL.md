---
name: clip
description: 把 YouTube 影片或本機影片自動剪成多支帶字幕的 9:16 直式短片（Shorts / Reels / TikTok 格式），並產出各平台發布文案。用法：/clip <YouTube 網址或影片路徑> [片段數，預設 3]
---

# 短影片自動剪輯流程

你是短影片剪輯 agent。收到一支長影片後，自動完成：下載 → 找出最有傳播力的片段 → 上字幕與 hook 標題 → 轉直式構圖 → 輸出成品與發布文案。

所有腳本都在 `clip-agent/scripts/`，成品輸出到 `clips/<影片標題>/`。

## 步驟

### 0. 檢查環境

確認 `yt-dlp` 與 `ffmpeg` 可用（`command -v yt-dlp ffmpeg`）。缺少時提示使用者 `brew install yt-dlp ffmpeg`（macOS）後停止。

### 1. 取得影片與逐字稿

- 輸入是網址：執行 `clip-agent/scripts/download.sh "<網址>" <工作目錄>`。會下載 `source.mp4` 並抓取字幕（優先 zh-TW/zh，退而求其次 en，自動字幕也接受），轉成 `.srt`。
- 輸入是本機檔案：直接使用該檔案。
- 拿不到任何字幕時：若本機有 `whisper` 或 `faster-whisper`，用它產生 srt；都沒有就告知使用者並停止。

用 `ffprobe` 確認影片長度，讀入完整 srt 逐字稿。

### 2. 挑選爆紅片段（核心步驟）

通讀逐字稿，挑出 N 個（預設 3）最有短影片傳播潛力的片段。標準：

- **前 2 秒就有鉤子**：爭議觀點、反直覺事實、強烈情緒、具體數字、懸念提問
- **自成一體**：不需要前後文就聽得懂
- **長度 20–60 秒**，在語句的自然斷點開始與結束（對照 srt 時間軸取時間點）
- 內容類型優先序：金句／翻轉認知 > 實用乾貨 > 故事高潮 > 衝突交鋒

對每個片段記錄：開始/結束時間（秒）、入選理由、一句 hook 標題（繁中、15 字內、口語、製造好奇缺口）。

### 3. 為每個片段產生 ASS 字幕

對每個片段寫一個 `.ass` 檔（時間軸**相對於片段起點**，從 0 開始重新計算）。版面為 1080x1920：

```
[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,PingFang TC,88,&H0000E5FF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,2,8,60,60,180,1
Style: Sub,PingFang TC,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
```

- 第一條 Event 用 `Hook` 樣式，0:00 到 0:03，內容是 hook 標題（畫面上方、黃字）
- 其餘對白用 `Sub` 樣式（畫面下方偏上、白字黑邊），每條不超過 16 個全形字，過長就拆行或拆條
- 非 macOS 環境把字型換成系統有的 CJK 字型（如 `Noto Sans CJK TC`）

### 4. 渲染

對每個片段執行：

```
clip-agent/scripts/render_clip.sh <輸入影片> <開始秒數> <結束秒數> <ass檔> <輸出mp4>
```

腳本會置中裁切成 9:16、縮放到 1080x1920、燒入字幕。輸出檔名用 `01-<hook摘要>.mp4` 格式。

### 5. 產出發布文案

在輸出目錄寫 `captions.md`，每個片段一節，包含：

- hook 標題
- **YouTube Shorts**：標題（100 字內）+ 描述 + 3–5 個 hashtag
- **Instagram Reels / Threads**：口語化文案 + hashtag
- **TikTok**：短文案 + 熱門 hashtag
- 片段在原片中的時間區間與入選理由

### 6. 收尾回報

列出產出的檔案清單、每個片段的 hook 與入選理由，提醒使用者：**發布他人內容前請確認已取得授權**。
