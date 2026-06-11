#!/usr/bin/env bash
# 下載 YouTube 影片與字幕（優先繁中，含自動字幕），輸出 source.mp4 與 .srt
# 用法: download.sh <YouTube網址> <工作目錄>
set -euo pipefail

URL=$1
DIR=$2
mkdir -p "$DIR"

yt-dlp \
  -f "bv*[ext=mp4][height<=1080]+ba[ext=m4a]/b[ext=mp4]/b" \
  --write-subs --write-auto-subs \
  --sub-langs "zh-TW,zh-Hant,zh,zh-Hans,en" \
  --convert-subs srt \
  --no-playlist \
  -o "$DIR/source.%(ext)s" \
  "$URL"

echo "--- 下載完成，工作目錄內容："
ls -la "$DIR"
