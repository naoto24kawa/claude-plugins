---
name: remote-chrome-e2e
description: This skill should be used when the user asks to "E2Eテスト", "操作してスクショ", "スクリーンショット", "画面確認", "動作検証してキャプチャ", "フォーム入力して確認", "クリックしてスクショ", "リモートで操作検証", "操作後の画面を撮影", "リモートChromeのキャプチャ", "remote screenshot", "remote E2E test", "interact then screenshot", "browser automation with capture", or needs to take screenshots or perform browser interactions (click, fill, navigate) followed by verification and screenshot capture on a remote macOS machine via SSH. Claude generates custom Playwright-core scripts for each scenario.
---

# Remote Chrome E2E

tmux MCP + SSH + Playwright-core を用いて、リモート macOS マシン上で **ブラウザ操作 + 検証 + スクリーンショット** を一貫して行うスキル。

Claude がユーザーの要望に基づいて Playwright スクリプトを都度生成し、操作後の状態をキャプチャする。

## 対応範囲

- 単純なスクショ(URL を開いて待機してキャプチャ)
- 操作後のスクショ(クリック、フォーム入力、ページ遷移など)
- コンテンツ検証(タイトル、テキスト、要素の存在確認)

全て Playwright-core のヘッドレス Chrome で実行する。

## 前提条件

- tmux MCP サーバーが有効であること
- リモートマシンが macOS であること
- リモートマシンに Google Chrome と Node.js がインストール済みであること
- SSH 接続が可能であること

## ワークフロー

### Phase 1: 環境確認

1. tmux MCP ツールをロードする(`ToolSearch` で `+tmux` を検索)
2. `.claude/remote-chrome.local.md` から接続情報を読み取る

```yaml
---
ssh_host: "192.168.1.x"
ssh_user: "username"
auth_method: "password"
---
```

3. tmux セッションを確認し、SSH 用ウィンドウを作成する

### Phase 2: リバーストンネル構築

ローカルアプリにリモートからアクセスする場合のみ必要。

```bash
ssh -R <REMOTE_PORT>:localhost:<LOCAL_PORT> -N <user>@<host>
```

リモートマシン上の既存サービスにアクセスする場合はスキップする。

### Phase 3: Playwright 環境準備

SSH 接続済みのペインで `playwright-core` をインストールする(未インストールの場合):

```bash
cd /tmp && npm install playwright-core
```

### Phase 4: スクリプト生成 + 転送

ユーザーの要望に基づいて Playwright スクリプトを生成する。

1. `scripts/pw_template.mjs` を `Read` ツールで読み取り、テンプレートとして使用する
2. `references/playwright-actions.md` を参照して適切な Playwright API を選択する
3. テンプレートの `Custom Actions` セクションにユーザーの操作を記述する
4. 生成したスクリプトを base64 エンコードしてリモートに転送する:

```bash
printf '<BASE64_ENCODED_CONTENT>' | base64 -d -o /tmp/pw_e2e.mjs
```

**スクリプト生成のポイント**:
- URL、操作内容、出力パスを全てインラインで記述する(引数ではなく)
- 操作の各段階で `console.log()` を入れて進捗を確認できるようにする
- `waitForSelector` や `waitForTimeout` で適切に待機する
- エラー時の `process.exitCode = 1` を維持する

### Phase 5: 実行 + 検証

```bash
node /tmp/pw_e2e.mjs
```

コンソール出力で以下を確認する:
- 各操作ステップのログ出力
- `Title` がアプリのタイトルになっていること
- `Body preview` にコンテンツが含まれていること
- `Screenshot saved` のファイルサイズが合理的であること(数 KB 以上)

**失敗した場合**: スクリプトを修正して再転送・再実行する。`references/playwright-actions.md` で代替 API を確認する。

### Phase 6: ファイル転送 + クリーンアップ

1. リモートで一時 HTTP サーバーを起動する(ポート 28080 = 8080 + 20000 のポート規約):

```bash
cd /tmp && python3 -m http.server 28080 &
```

2. ローカルで SSH フォワードトンネルを作成する(別ペイン):

```bash
ssh -L 28080:localhost:28080 -N <user>@<host>
```

3. ローカルで curl でダウンロードする:

```bash
curl -o <LOCAL_PATH> http://localhost:28080/pw_e2e.png
```

4. `Read` ツールでダウンロードした画像を確認する(Claude Code は画像を表示可能)

5. クリーンアップ:

```bash
# リモート側
kill %1  # HTTP サーバー停止
rm /tmp/pw_e2e.mjs /tmp/pw_e2e.png
```

## tmux MCP コマンドの使い分け

| パラメータ | 用途 |
|-----------|------|
| `rawMode: false` (デフォルト) | 通常コマンド。結果を `get-command-result` で取得可能 |
| `rawMode: true` | 対話的コマンド(SSH、パスワード入力等)。`capture-pane` で結果確認 |
| `noEnter: true` | キー送信のみ(Ctrl+C 等)。`C-c` で中断操作 |

## トラブルシューティング

`references/troubleshooting.md` を参照。構文エラー、セレクタ未検出、真っ白スクショ、ハング時の対処法を収録。

## Playwright API リファレンス

`references/playwright-actions.md` を参照。ナビゲーション、クリック、入力、待機、クエリ、スクリーンショットなどの API と E2E パターン例を収録。

## スクリーンショット制約

リモート macOS での制約事項は `references/constraints.md` を参照。 **Playwright-core** が唯一の信頼できるスクリーンショット方法。
