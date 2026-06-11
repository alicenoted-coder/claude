#!/usr/bin/env bash
# 從長影片切出片段，置中裁切成 9:16 直式 1080x1920，並燒入 ASS 字幕
# 用法: render_clip.sh <輸入影片> <開始秒數> <結束秒數> <ass字幕檔> <輸出mp4>
# 注意: ass 檔的時間軸必須相對於片段起點（從 0 開始）
set -euo pipefail

INPUT=$1
START=$2
END=$3
ASS=$4
OUTPUT=$5

ffmpeg -y -ss "$START" -to "$END" -i "$INPUT" \
  -vf "crop='min(iw,ih*9/16)':ih,scale=1080:1920,ass='$ASS'" \
  -c:v libx264 -preset fast -crf 20 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$OUTPUT"

echo "--- 已輸出: $OUTPUT"
