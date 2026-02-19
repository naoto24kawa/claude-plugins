---
name: remote-chrome-control
description: This skill should be used when the user asks to "SSH先のChromeを操作したい", "リモートマシンのブラウザを操作", "Chrome操作", "リモートでアプリの動作検証", "tmuxでSSH接続してChrome", "リモートブラウザテスト", "remote Chrome control", "osascriptでChrome操作", or needs to control Chrome on a remote macOS machine via SSH and tmux MCP. Provides the complete workflow for SSH connection, Chrome tab management, URL navigation, and JavaScript execution through AppleScript.
---

# Remote Chrome Control

tmux MCP + SSH + AppleScript(osascript) を用いて、リモート macOS マシン上の Google Chrome を Claude Code から操作するスキル。

## 前提条件

- tmux MCP サーバーが有効であること
- リモートマシンが macOS であること(AppleScript を使用)
- リモートマシンに Google Chrome がインストール済みであること
- SSH 接続が可能であること(鍵認証推奨)

## 接続情報の管理

接続情報は `.claude/remote-chrome.local.md` で管理する。

```yaml
---
ssh_host: "192.168.1.x"
ssh_user: "username"
auth_method: "key"  # "key" or "password"
---
```

このファイルが存在する場合、読み取って接続情報として使用する。存在しない場合はユーザーに確認する。

## ワークフロー

### Phase 1: 環境準備

1. tmux MCP ツールをロードする(`ToolSearch` で `+tmux` を検索)
2. `.claude/remote-chrome.local.md` から接続情報を読み取る(存在しない場合はユーザーに確認)
3. tmux セッションを確認し、SSH 用ウィンドウを作成する

```
mcp__tmux__list-sessions → 既存セッション確認
mcp__tmux__create-window → SSH 用ウィンドウ作成
```

### Phase 2: SSH 接続

1. SSH コマンドを rawMode で実行する
2. ホスト鍵確認が出た場合は `yes` を送信する
3. パスワード認証の場合は rawMode でパスワードを送信する
4. `capture-pane` で接続完了を確認する

```
mcp__tmux__execute-command (rawMode: true) → ssh user@host
mcp__tmux__capture-pane → 接続確認
```

**重要**: SSH の対話プロンプト(ホスト鍵確認、パスワード)は `rawMode: true` で送信する。

### Phase 3: Chrome 操作

接続後、`osascript` コマンドで Chrome を制御する。

#### よく使うコマンド例

```bash
# タイトル取得
osascript -e 'tell application "Google Chrome" to return title of active tab of window 1'

# URL ナビゲーション
osascript -e 'tell application "Google Chrome" to set URL of active tab of window 1 to "https://..."'

# 新規タブ作成
osascript -e 'tell application "Google Chrome" to tell window 1 to make new tab with properties {URL:"https://..."}'
```

全コマンドの一覧は `references/osascript-chrome-commands.md` を参照。

#### JavaScript 実行(要設定)

Chrome 側で「表示 > デベロッパー > Apple Events からの JavaScript を許可」の有効化が必要。詳細は `references/osascript-chrome-commands.md` の JavaScript 実行セクションを参照。

#### ステータス一括取得

`scripts/chrome-status.sh` をリモートマシン上で実行すると、全ウィンドウ/タブの情報を一括取得できる。

### Phase 4: アプリ動作検証

1. 対象アプリの URL を Chrome で開く
2. ページタイトルで読み込み完了を確認する(`sleep` + タイトル取得)
3. JavaScript 実行で DOM 要素を検証する
4. フォーム入力やボタンクリックを JavaScript で実行する
5. 画面遷移後のタイトル/URL で結果を確認する

### Phase 5: クリーンアップ

1. テスト用に開いたタブを閉じる
2. SSH セッションから `exit` する
3. 不要な tmux ウィンドウを閉じる

## tmux MCP コマンドの使い分け

| パラメータ | 用途 |
|-----------|------|
| `rawMode: false` (デフォルト) | 通常コマンド。結果を `get-command-result` で取得可能 |
| `rawMode: true` | 対話的コマンド(SSH、パスワード入力等)。`capture-pane` で結果確認 |
| `noEnter: true` | キー送信のみ(Ctrl+C 等)。`C-c` で中断操作 |

## トラブルシューティング

詳細は `references/troubleshooting.md` を参照。

## osascript Chrome コマンドリファレンス

詳細は `references/osascript-chrome-commands.md` を参照。
