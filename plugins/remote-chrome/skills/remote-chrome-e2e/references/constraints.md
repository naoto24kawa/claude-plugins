# Screenshot Constraints on Remote macOS (via SSH)

M3 Mac + macOS 環境で検証済みの制約事項。

## 動作しない方法

### CDP `Page.captureScreenshot`

- Chrome DevTools Protocol の `Page.captureScreenshot` コマンドは M3 Mac + macOS 環境でタイムアウトする
- WebSocket 経由で `Page.enable` 後に `Page.captureScreenshot` を送信しても応答が返らない
- Python / Node.js 両方で確認済み

### Headless Chrome `--screenshot`

- `--headless --screenshot=/tmp/out.png` はページ読み込み直後にスナップショットを取る
- SSE 接続や API レスポンスの完了を待たないため、非同期コンテンツが "Loading..." のままキャプチャされる
- 静的コンテンツには使えるが、SPA / リアルタイムアプリには不適

### `--virtual-time-budget`

- Chrome の仮想時間進行オプション
- この環境ではハングする場合がある(使用非推奨)

### macOS `screencapture` コマンド

- SSH セッションからは動作しない
- WindowServer へのアクセスが必要だが、SSH セッションにはその権限がない

### VNC (Screen Sharing)

- macOS の画面共有でリモートデスクトップを取得可能だが、ロック画面がキャプチャされる
- GUI セッションがアクティブでないと実用的でない

## 動作する方法

### Playwright-core (推奨)

- `playwright-core` + 既存 Chrome で新規ヘッドレスインスタンスを起動する方法
- `chromium.launch()` で Chrome バイナリを指定し、ヘッドレスモードで起動
- `page.goto()` + `page.waitForTimeout()` で非同期コンテンツの読み込みを待機
- `page.screenshot()` で確実にキャプチャできる
- CDP ポート不要(Playwright が内部で管理)

**成功実績**: 83,314 bytes のスクリーンショットを取得(SSE接続後の通知一覧を含む)

## 環境要件

- Node.js (v18+)
- `playwright-core` パッケージ (`npm install playwright-core`)
- Google Chrome がインストール済み (`/Applications/Google Chrome.app/`)
