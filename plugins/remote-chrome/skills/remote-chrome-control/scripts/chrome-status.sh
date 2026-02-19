#!/bin/bash
# Chrome の状態を一括取得するヘルパースクリプト
# リモート macOS 上で実行する
#
# Usage: bash chrome-status.sh
# Output: JSON 形式で Chrome の状態を出力

echo "=== Chrome Status ==="
echo ""

# ウィンドウ数
WIN_COUNT=$(osascript -e 'tell application "Google Chrome" to return count of windows' 2>/dev/null)
if [ $? -ne 0 ]; then
  echo "ERROR: Chrome is not running or not accessible"
  exit 1
fi
echo "Windows: ${WIN_COUNT}"
echo ""

# 各ウィンドウのアクティブタブ
echo "=== Active Tabs ==="
osascript \
  -e 'tell application "Google Chrome"' \
  -e 'set i to 1' \
  -e 'repeat with w in windows' \
  -e 'set t to active tab of w' \
  -e 'log "Window " & i & ": " & (title of t) & " | " & (URL of t)' \
  -e 'set i to i + 1' \
  -e 'end repeat' \
  -e 'end tell' 2>&1
echo ""

# ウィンドウ1の全タブ
echo "=== Window 1 All Tabs ==="
osascript \
  -e 'tell application "Google Chrome" to tell window 1' \
  -e 'set tabCount to count of tabs' \
  -e 'repeat with i from 1 to tabCount' \
  -e 'log "  Tab " & i & ": " & (title of tab i)' \
  -e 'end repeat' \
  -e 'end tell' 2>&1
