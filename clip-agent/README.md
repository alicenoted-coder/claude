# Clip Agent — 短影片自動剪輯 agent

把一支長影片（YouTube 或本機檔案）自動剪成多支帶字幕的 9:16 直式短片，並產出
YouTube Shorts / Instagram Reels / Threads / TikTok 的發布文案。

整條流程由 Claude Code 的 `/clip` skill 指揮（定義在 `.claude/skills/clip/SKILL.md`）：

1. `yt-dlp` 下載影片＋字幕（優先繁中，接受自動字幕）
2. Claude 通讀逐字稿，挑出最有傳播力的 3–5 個片段
3. Claude 為每段寫 hook 標題與 ASS 字幕
4. `ffmpeg` 裁切成直式 1080x1920 並燒入字幕
5. 產出 `captions.md`：各平台的標題、文案、hashtag

成品放在 `clips/<影片標題>/`，**不會自動發布**——看過成品後再手動發。

## 安裝（macOS）

```bash
brew install yt-dlp ffmpeg
```

（選用）影片沒有字幕時的備援轉錄：

```bash
pip install faster-whisper
```

## 使用方式

在這個 repo 目錄打開 Claude Code（桌面版或 CLI），輸入：

```
/clip https://www.youtube.com/watch?v=XXXX
/clip ~/Movies/podcast-ep12.mp4 5     # 指定剪 5 段
```

## 定時全自動（盯著某個頻道）

`scripts/watch_channel.sh` 會檢查頻道最新影片，發現新片就用 `claude -p`
無人值守跑完整條剪輯流程（用 `.last_video_id` 避免重複處理）。

加進 crontab（例：每天早上 9 點檢查）：

```cron
0 9 * * * cd /path/to/this/repo && ./clip-agent/scripts/watch_channel.sh "https://www.youtube.com/@somechannel" >> /tmp/clip-agent.log 2>&1
```

> macOS 注意：cron 環境的 PATH 很乾淨，必要時在 crontab 開頭加上
> `PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin`。

## ⚠️ 版權提醒

下載並二創**他人的** YouTube 內容後公開發布，多數情況需要原作者授權
（YouTube 服務條款亦禁止未經授權的下載轉載）。請只發布：

- 你自己的內容
- 已取得授權或採 CC 授權的內容

未經授權的素材僅供個人研究使用。

## Roadmap

- [ ] 人臉偵測自動構圖（講者移動時跟著裁切，取代目前的置中裁切）
- [ ] 自動發布：YouTube Data API（Shorts）→ Meta Graph API（Reels）→ Buffer（Threads/TikTok）
- [ ] 多頻道監看與每日剪輯報告
