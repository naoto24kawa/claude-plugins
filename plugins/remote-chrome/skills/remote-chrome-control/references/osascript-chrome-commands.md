# osascript Chrome コマンドリファレンス

macOS の AppleScript(osascript)で Google Chrome を制御する全コマンド集。

## ウィンドウ操作

### ウィンドウ数を取得
```bash
osascript -e 'tell application "Google Chrome" to return count of windows'
```

### ウィンドウを最前面に移動
```bash
osascript -e 'tell application "Google Chrome" to activate'
```

### 新規ウィンドウを作成
```bash
osascript -e 'tell application "Google Chrome" to make new window'
```

### ウィンドウのサイズ・位置を設定
```bash
osascript -e 'tell application "Google Chrome" to set bounds of window 1 to {0, 0, 1280, 800}'
```

## タブ操作

### アクティブタブのタイトルを取得
```bash
osascript -e 'tell application "Google Chrome" to return title of active tab of window 1'
```

### アクティブタブのURLを取得
```bash
osascript -e 'tell application "Google Chrome" to return URL of active tab of window 1'
```

### 特定ウィンドウのタブ数を取得
```bash
osascript -e 'tell application "Google Chrome" to return count of tabs of window 1'
```

### N番目のタブのタイトルを取得
```bash
osascript -e 'tell application "Google Chrome" to return title of tab 2 of window 1'
```

### N番目のタブのURLを取得
```bash
osascript -e 'tell application "Google Chrome" to return URL of tab 2 of window 1'
```

### 新規タブを作成(URLを指定)
```bash
osascript -e 'tell application "Google Chrome" to tell window 1 to make new tab with properties {URL:"https://example.com"}'
```

### アクティブタブのURLを変更(ナビゲーション)
```bash
osascript -e 'tell application "Google Chrome" to set URL of active tab of window 1 to "https://example.com"'
```

### 特定タブをアクティブにする
```bash
osascript -e 'tell application "Google Chrome" to set active tab index of window 1 to 3'
```

### 最後のタブを閉じる
```bash
osascript -e 'tell application "Google Chrome" to tell window 1 to close tab (count of tabs)'
```

### 特定タブを閉じる(非アクティブタブ)
```bash
osascript -e 'tell application "Google Chrome" to tell window 1 to close tab 3'
```

### アクティブタブをリロード
```bash
osascript -e 'tell application "Google Chrome" to reload active tab of window 1'
```

## 全タブ/ウィンドウの情報取得

### 全ウィンドウのアクティブタブを一覧
```bash
osascript \
  -e 'tell application "Google Chrome" to repeat with w in windows' \
  -e 'set t to active tab of w' \
  -e 'log (title of t) & " | " & (URL of t)' \
  -e 'end repeat'
```

### 特定ウィンドウの全タブを一覧
```bash
osascript \
  -e 'tell application "Google Chrome" to tell window 1' \
  -e 'set tabCount to count of tabs' \
  -e 'repeat with i from 1 to tabCount' \
  -e 'log (title of tab i) & " | " & (URL of tab i)' \
  -e 'end repeat' \
  -e 'end tell'
```

## JavaScript 実行

**前提**: Chrome 設定で「表示 > デベロッパー > Apple Events からの JavaScript を許可」が有効であること。

### テキスト取得
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "document.querySelector(\"h1\").textContent"'
```

### 要素の存在確認
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "!!document.querySelector(\".my-class\")"'
```

### フォーム入力
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "document.querySelector(\"#email\").value = \"test@example.com\""'
```

### ボタンクリック
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "document.querySelector(\"button[type=submit]\").click()"'
```

### ページの読み込み状態確認
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "document.readyState"'
```

### スクロール
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "window.scrollTo(0, document.body.scrollHeight)"'
```

### 複数の値をまとめて取得
```bash
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "JSON.stringify({title: document.title, url: location.href, h1: document.querySelector(\"h1\")?.textContent})"'
```

## 読み込み完了を待つパターン

osascript 自体には wait 機能がないため、シェルの `sleep` と組み合わせる:

```bash
# URL を変更して読み込み完了を待つ
osascript -e 'tell application "Google Chrome" to set URL of active tab of window 1 to "https://example.com"'
sleep 3
osascript -e 'tell application "Google Chrome" to return title of active tab of window 1'
```

## エスケープに関する注意

osascript 内でダブルクォートを使う場合、シェルのエスケープに注意:

```bash
# シングルクォートで囲み、JS内はバックスラッシュエスケープ
osascript -e 'tell application "Google Chrome" to execute active tab of window 1 javascript "document.querySelector(\"#id\")"'
```
