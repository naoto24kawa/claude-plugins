# E2E スクリプト トラブルシューティング

## スクリプトの構文エラー

base64 転送後に構文チェックを行う:

```bash
node --check /tmp/pw_e2e.mjs
```

エラーがあればスクリプトを修正して再転送する。よくある原因:
- base64 エンコード/デコード時の文字化け
- テンプレートの `Custom Actions` セクション編集時の構文ミス
- `await` の付け忘れ(Playwright API は全て非同期)

## セレクタが見つからない

```bash
# エラー例: TimeoutError: waiting for selector ".result-list" failed
```

対処法:
- `page.waitForSelector()` のタイムアウトを増やす (`{ timeout: 30000 }`)
- `page.content()` でページの HTML を確認し、実際のセレクタを特定する
- `page.locator().count()` でセレクタのマッチ数を確認する
- CSS セレクタの代わりにテキストベースのセレクタを試す (`text=Submit`)

## スクリーンショットが真っ白

対処法:
- `page.waitForTimeout()` の待機時間を増やす(例: 5000 -> 10000)
- `page.waitForLoadState('networkidle')` でネットワーク活動の完了を待つ
- アプリが実際にアクセス可能か確認する(`curl` でレスポンスを確認)
- リバーストンネルが正常に動作しているか確認する

## "Browser closed" エラー

対処法:
- Chrome のパスが正しいか確認する(`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`)
- Chrome が他のプロセスでロックされていないか確認する
- `--no-sandbox` フラグが指定されているか確認する

## スクリプトがハングする

対処法:
- `page.goto()` の `timeout` を確認する(デフォルト 30000ms)
- `waitForSelector` が存在しない要素を待っていないか確認する
- tmux の `capture-pane` で出力を確認し、どのステップで止まっているか特定する
- Ctrl+C (`noEnter: true` で `C-c` を送信) でスクリプトを中断する
