# Playwrightテスト詳細ガイド

このガイドでは、PlaywrightMCPサーバーを使用した詳細なテスト手法とベストプラクティスを説明します。

## PlaywrightMCPツール一覧

### ナビゲーション

#### browser_navigate
```typescript
// 指定URLへ移動
browser_navigate({ url: "https://example.com" })
```

#### browser_navigate_back / browser_navigate_forward
```typescript
// ブラウザの戻る/進むボタン操作
browser_navigate_back()
browser_navigate_forward()
```

### 要素操作

#### browser_click
```typescript
// 要素をクリック
browser_click({ selector: "button#submit" })
```

#### browser_type
```typescript
// テキスト入力
browser_type({
  selector: "input#email",
  text: "user@example.com"
})
```

#### browser_hover
```typescript
// 要素にマウスホバー
browser_hover({ selector: ".dropdown-trigger" })
```

#### browser_drag
```typescript
// ドラッグ&ドロップ
browser_drag({
  selector: ".draggable-item",
  targetSelector: ".drop-zone"
})
```

### フォーム操作

#### browser_fill_form
```typescript
// フォーム一括入力
browser_fill_form({
  formData: {
    "input#name": "John Doe",
    "input#email": "john@example.com",
    "textarea#message": "Hello"
  }
})
```

#### browser_file_upload
```typescript
// ファイルアップロード
browser_file_upload({
  selector: "input[type=file]",
  filePath: "/path/to/file.pdf"
})
```

#### browser_select_option
```typescript
// セレクトボックス選択
browser_select_option({
  selector: "select#country",
  value: "JP"
})
```

### キーボード操作

#### browser_press_key
```typescript
// キーボードイベント送信
browser_press_key({ key: "Enter" })
browser_press_key({ key: "Escape" })
browser_press_key({ key: "Tab" })
```

### 検証とデバッグ

#### browser_take_screenshot
```typescript
// スクリーンショット撮影
browser_take_screenshot({
  name: "login-page.png",
  fullPage: true
})
```

#### browser_snapshot
```typescript
// ページスナップショット（HTML構造）
browser_snapshot()
```

#### browser_console_messages
```typescript
// コンソールログ取得
browser_console_messages()
```

#### browser_network_requests
```typescript
// ネットワークリクエスト監視
browser_network_requests()
```

#### browser_handle_dialog
```typescript
// アラート/確認ダイアログ処理
browser_handle_dialog({
  action: "accept",  // または "dismiss"
  promptText: "確認"
})
```

### JavaScript実行

#### browser_evaluate
```typescript
// ページ内でJavaScript実行
browser_evaluate({
  script: "return document.title"
})
```

### 待機処理

#### browser_wait_for
```typescript
// 要素の出現を待機
browser_wait_for({
  selector: ".loading-spinner",
  state: "hidden",  // "visible", "hidden", "attached", "detached"
  timeout: 30000
})
```

### タブ管理

#### browser_tab_list
```typescript
// 開いているタブ一覧を取得
browser_tab_list()
```

#### browser_tab_new
```typescript
// 新しいタブを開く
browser_tab_new({ url: "https://example.com" })
```

#### browser_tab_select
```typescript
// タブを切り替え
browser_tab_select({ tabId: "tab-123" })
```

#### browser_tab_close
```typescript
// タブを閉じる
browser_tab_close({ tabId: "tab-123" })
```

### ブラウザ制御

#### browser_resize
```typescript
// ブラウザサイズ変更
browser_resize({ width: 1920, height: 1080 })
```

#### browser_install
```typescript
// Playwrightインストール（初回のみ）
browser_install()
```

#### browser_close
```typescript
// ブラウザを閉じる
browser_close()
```

## テストシナリオのパターン

### パターン1: ログインフロー検証

```
1. browser_navigate: ログインページへ移動
2. browser_take_screenshot: 初期状態を記録
3. browser_type: メールアドレス入力
4. browser_type: パスワード入力
5. browser_click: ログインボタンクリック
6. browser_wait_for: ダッシュボード要素の出現を待機
7. browser_take_screenshot: ログイン後の状態を記録
8. browser_console_messages: エラーログ確認
9. 検証: 期待するURLへリダイレクトされたか
```

### パターン2: フォーム送信検証

```
1. browser_navigate: フォームページへ移動
2. browser_fill_form: 複数フィールドを一括入力
3. browser_file_upload: 添付ファイルをアップロード
4. browser_select_option: ドロップダウンから選択
5. browser_click: 送信ボタンクリック
6. browser_wait_for: 成功メッセージの出現を待機
7. browser_network_requests: API呼び出しを確認
8. browser_take_screenshot: 完了画面を記録
```

### パターン3: レスポンシブデザイン検証

```
各デバイスサイズでテスト:
- モバイル: browser_resize({ width: 375, height: 667 })
- タブレット: browser_resize({ width: 768, height: 1024 })
- デスクトップ: browser_resize({ width: 1920, height: 1080 })

各サイズで:
1. ページ読み込み
2. レイアウト確認（スクリーンショット）
3. インタラクション検証（クリック、ホバー）
4. コンソールエラー確認
```

### パターン4: SPA（Single Page Application）検証

```
1. browser_navigate: 初期ページへ移動
2. browser_wait_for: アプリケーション初期化完了を待機
3. 各ルート遷移:
   - browser_click: ナビゲーションリンククリック
   - browser_wait_for: 新しいコンテンツの表示を待機
   - browser_evaluate: 現在のルートパスを取得
   - browser_take_screenshot: 各ページの状態を記録
4. browser_navigate_back: ブラウザバック機能の検証
5. browser_console_messages: SPAエラーログ確認
```

### パターン5: 動的コンテンツ検証

```
1. browser_navigate: ページへ移動
2. browser_wait_for: 初期ローディング完了
3. browser_click: 「さらに読み込む」ボタンクリック
4. browser_wait_for: 新しいコンテンツの追加を待機
5. browser_evaluate: 追加されたアイテム数を確認
6. browser_network_requests: 追加のAPIリクエスト確認
7. browser_snapshot: 最終的なDOM構造を記録
```

## 待機戦略のベストプラクティス

### 明示的な待機（推奨）

```typescript
// 特定の要素が表示されるまで待機
browser_wait_for({
  selector: ".success-message",
  state: "visible",
  timeout: 10000
})
```

### ネットワークアイドル待機

```typescript
// ネットワークリクエストが完了するまで待機
browser_wait_for({
  event: "networkidle",
  timeout: 30000
})
```

### カスタム条件待機

```typescript
// JavaScriptで条件を評価
browser_evaluate({
  script: "return window.appReady === true"
})
```

## エラーハンドリング

### エラー検出のチェックポイント

1. **ページ読み込みエラー**
   - `browser_console_messages` で404や500エラーを確認
   - スクリーンショットでエラーページを記録

2. **JavaScript実行エラー**
   - `browser_console_messages` でスクリプトエラーを検出
   - エラースタックトレースを記録

3. **ネットワークエラー**
   - `browser_network_requests` で失敗したリクエストを確認
   - ステータスコード、レスポンスタイムを記録

4. **タイムアウトエラー**
   - `browser_wait_for` でタイムアウト発生時の状態を記録
   - スクリーンショットとDOM構造を保存

### エラー発生時の対応フロー

```
エラー検出
  ↓
1. browser_take_screenshot: 現在の画面状態を保存
2. browser_console_messages: コンソールログを取得
3. browser_network_requests: ネットワーク状態を確認
4. browser_snapshot: DOM構造を記録
5. エラー詳細をレポートに記載
  ↓
次のステップへ継続 または テスト中断
```

## パフォーマンス最適化

### スクリーンショットの最適化

```typescript
// フルページスクリーンショットは必要な時のみ
browser_take_screenshot({
  name: "full-page.png",
  fullPage: true  // リソース消費大
})

// 通常は viewport のみ
browser_take_screenshot({
  name: "viewport.png",
  fullPage: false  // 推奨
})
```

### 並行テスト実行

複数のテストケースを並行実行する場合：
- 各テストで独立したブラウザインスタンスを使用
- 共有リソースへのアクセスを制限
- タブ機能を活用してブラウザインスタンスを削減

### リソース管理

```typescript
// テスト完了後は必ずブラウザを閉じる
try {
  // テスト実行
} finally {
  browser_close()
}
```

## セキュリティとプライバシー

### 認証情報の扱い

- パスワードなどの機密情報は環境変数から取得
- スクリーンショットに機密情報が含まれないよう注意
- テストログから認証情報を除外

### テスト環境の分離

- 本番環境ではなく、テスト環境を使用
- テストデータは本番データと分離
- 外部サービスはモック化を検討

このガイドを活用して、効果的で保守性の高いPlaywrightテストを作成してください。
