#!/usr/bin/env bash
# 檢查 YouTube 頻道是否有新影片，有的話用 claude -p 觸發 /clip 自動剪輯
# 用法: watch_channel.sh <頻道網址，例如 https://www.youtube.com/@somechannel>
# 搭配 cron 使用，見 clip-agent/README.md
set -euo pipefail

CHANNEL_URL=$1
REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_FILE="$REPO_DIR/clip-agent/.last_video_id"

LATEST_JSON=$(yt-dlp --flat-playlist --playlist-end 1 -j "$CHANNEL_URL/videos")
VIDEO_ID=$(echo "$LATEST_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
VIDEO_URL="https://www.youtube.com/watch?v=$VIDEO_ID"

if [[ -f "$STATE_FILE" ]] && [[ "$(cat "$STATE_FILE")" == "$VIDEO_ID" ]]; then
  echo "沒有新影片（最新仍是 $VIDEO_ID），結束。"
  exit 0
fi

echo "發現新影片: $VIDEO_URL，開始剪輯..."
cd "$REPO_DIR"
claude -p --permission-mode acceptEdits "/clip $VIDEO_URL"

echo "$VIDEO_ID" > "$STATE_FILE"
echo "完成，已記錄 $VIDEO_ID"
