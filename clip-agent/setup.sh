#!/usr/bin/env bash
# clip-agent 一鍵安裝腳本（macOS）
# 用法：在終端機執行
#   bash <(curl -fsSL https://raw.githubusercontent.com/alicenoted-coder/claude/claude/desktop-automation-agent-3bdwuu/clip-agent/setup.sh)
set -euo pipefail

REPO_URL="https://github.com/alicenoted-coder/claude.git"
BRANCH="claude/desktop-automation-agent-3bdwuu"
TARGET="$HOME/claude"

echo "==> [1/3] 檢查 Homebrew..."
if ! command -v brew >/dev/null 2>&1; then
  echo "    沒有 Homebrew，開始安裝（過程中會要求輸入 Mac 登入密碼，輸入時畫面不會顯示字元是正常的）"
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  [[ -x /opt/homebrew/bin/brew ]] && eval "$(/opt/homebrew/bin/brew shellenv)"
  [[ -x /usr/local/bin/brew ]] && eval "$(/usr/local/bin/brew shellenv)"
fi
echo "    Homebrew OK"

echo "==> [2/3] 安裝 yt-dlp 與 ffmpeg（已安裝會自動跳過）..."
brew list yt-dlp >/dev/null 2>&1 || brew install yt-dlp
brew list ffmpeg >/dev/null 2>&1 || brew install ffmpeg
echo "    yt-dlp: $(yt-dlp --version)"
echo "    ffmpeg: $(ffmpeg -version | head -1)"

echo "==> [3/3] 下載 clip-agent 到 $TARGET ..."
if [[ -d "$TARGET/.git" ]]; then
  git -C "$TARGET" fetch origin "$BRANCH"
  git -C "$TARGET" checkout "$BRANCH"
  git -C "$TARGET" pull origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$TARGET"
fi

echo ""
echo "✅ 全部完成！下一步："
echo "   1. 打開 Claude Code 桌面版，開啟資料夾：$TARGET"
echo "   2. 輸入：/clip <YouTube 網址>"
echo "   成品會出現在 $TARGET/clips/"
