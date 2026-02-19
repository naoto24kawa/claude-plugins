---
name: remote-chrome-screenshot
description: This skill should be used when the user asks to "リモートマシンのスクリーンショットを取りたい", "SSHでスクリーンショット", "リモートChromeのキャプチャ", "アプリの画面を撮影", "画面確認", "UIを確認", "リモートでブラウザ表示を確認", "remote screenshot", "capture remote browser", "take a screenshot via SSH", "Playwrightでスクリーンショット", or needs to take screenshots of web applications running on or accessible from a remote macOS machine via SSH. Uses Playwright-core to launch headless Chrome, wait for async content, and capture reliable screenshots.
---

# Remote Chrome Screenshot

tmux MCP + SSH + Playwright-core を用いて、リモート macOS マシン上の Chrome でスクリーンショットを取得するスキル。

## 前提条件

- tmux MCP サーバーが有効であること
- リモートマシンが macOS であること
- リモートマシンに Google Chrome と Node.js がインストール済みであること
- SSH 接続が可能であること

## なぜ Playwright-core か

他の方法は全てこの環境で失敗する。詳細は `references/constraints.md` を参照。

- CDP `Page.captureScreenshot`: タイムアウト
- headless `--screenshot`: 非同期コンテンツを待たない
- `screencapture`: SSH セッションから動作不可
- VNC: ロック画面がキャプチャされる

**Playwright-core** が唯一の信頼できる方法。

## ワークフロー

### Phase 1: 環境確認

1. tmux MCP ツールをロードする(`ToolSearch` で `+tmux` を検索)
2. `.claude/remote-chrome.local.md` から接続情報を読み取る

```yaml
# .claude/remote-chrome.local.md の frontmatter
---
ssh_host: "192.168.1.x"
ssh_user: "username"
auth_method: "password"  # "key" or "password"
---
```

3. tmux セッションを確認し、SSH 用ウィンドウを作成する

### Phase 2: リバーストンネル構築

ローカルで動作しているアプリにリモートマシンからアクセスする場合、リバース SSH トンネルが必要。

1. トンネル用の tmux ウィンドウ/ペインを作成する
2. リバーストンネルを張る:

```bash
ssh -R <REMOTE_PORT>:localhost:<LOCAL_PORT> -N <user>@<host>
```

例: ローカルの `:23000` をリモートから `localhost:23000` でアクセス可能にする:

```bash
ssh -R 23000:localhost:23000 -N <user>@<host>
```

3. `capture-pane` でトンネル確立を確認する(エラーが出ていないこと)

**注意**: リモートマシン上の既存サービスにアクセスする場合はトンネル不要。

### Phase 3: Playwright 環境準備

SSH 接続済みのペインで以下を実行する。

1. `playwright-core` をインストール(未インストールの場合):

```bash
cd /tmp && npm install playwright-core
```

2. スクリーンショットスクリプトを配置する。
   スキル内の `scripts/pw_screenshot.mjs` をリモートマシンの `/tmp/pw_screenshot.mjs` に転送する。

**転送方法**: スクリプト内容を base64 エンコードして送信する:

```bash
printf '<BASE64_ENCODED_CONTENT>' | base64 -d -o /tmp/pw_screenshot.mjs
```

スクリプトの内容は `scripts/pw_screenshot.mjs` を `Read` ツールで読み取り、base64 エンコードする。

### Phase 4: スクリーンショット取得

```bash
node /tmp/pw_screenshot.mjs <URL> <OUTPUT_PATH> <WAIT_SECONDS>
```

引数:
- `URL`: 対象ページの URL (デフォルト: `http://localhost:23000/`)
- `OUTPUT_PATH`: 保存先パス (デフォルト: `/tmp/pw_screenshot.png`)
- `WAIT_SECONDS`: 非同期コンテンツの読み込み待機秒数 (デフォルト: `5`)

例:

```bash
node /tmp/pw_screenshot.mjs http://localhost:23000/ /tmp/pw_screenshot.png 5
```

出力例:

```
Navigating to http://localhost:23000/
Waiting 5s for async content...
Title: Notifications
Body preview: NotificationsConnected130...
Taking screenshot...
Saved: /tmp/pw_screenshot.png (83314 bytes)
Done.
```

**確認ポイント**:
- `Title` がアプリのタイトルになっていること("Loading..." でないこと)
- `Body preview` にコンテンツが含まれていること
- ファイルサイズが合理的であること(数 KB 以上)

### Phase 5: ファイル転送

リモートマシンからローカルにスクリーンショットを転送する。

1. リモートマシン上で一時 HTTP サーバーを起動する(ポート 28080 は 8080 + 20000 のポート規約に基づく):

```bash
cd /tmp && python3 -m http.server 28080 &
```

2. ローカル側で SSH フォワードトンネルを作成する(別ペイン):

```bash
ssh -L 28080:localhost:28080 -N <user>@<host>
```

3. ローカル側で curl でダウンロードする:

```bash
curl -o <LOCAL_PATH> http://localhost:28080/pw_screenshot.png
```

4. `Read` ツールでダウンロードした画像を確認する(Claude Code は画像を表示可能)

### Phase 6: クリーンアップ

1. リモートの HTTP サーバーを停止する:

```bash
kill %1  # または: pkill -f 'python3 -m http.server 28080'
```

2. リモートの一時ファイルを削除する:

```bash
rm /tmp/pw_screenshot.png
```

3. SSH フォワードトンネルのペインを閉じる(不要な場合)
4. リバーストンネルは必要に応じて維持する(`remote-chrome.local.md` の Active Sessions に記録)

## tmux MCP コマンドの使い分け

| パラメータ | 用途 |
|-----------|------|
| `rawMode: false` (デフォルト) | 通常コマンド。結果を `get-command-result` で取得可能 |
| `rawMode: true` | 対話的コマンド(SSH、パスワード入力等)。`capture-pane` で結果確認 |
| `noEnter: true` | キー送信のみ(Ctrl+C 等)。`C-c` で中断操作 |

## トラブルシューティング

### `playwright-core` のインストールが失敗する

```bash
# node_modules が壊れている場合
rm -rf /tmp/node_modules /tmp/package-lock.json
cd /tmp && npm install playwright-core
```

### スクリーンショットが真っ白

- `WAIT_SECONDS` を増やす(例: `10`)
- アプリが実際にアクセス可能か確認する(`curl` でレスポンスを確認)
- リバーストンネルが正常に動作しているか確認する

### "Browser closed" エラー

- Chrome のパスが正しいか確認する
- Chrome が他のプロセスでロックされていないか確認する

## 制約事項の詳細

`references/constraints.md` を参照。
