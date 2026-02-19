# トラブルシューティング

## SSH 接続

### sudo パスワードプロンプトに詰まった場合

`C-c` (Ctrl+C) を `noEnter: true` で送信して中断する:

```
mcp__tmux__execute-command(paneId, command: "C-c", noEnter: true)
```

3回失敗すると sudo は自動終了する。空 Enter を `rawMode: true` で送って失敗回数を消化する方法もある。

### SSH パスワード認証が失敗する場合

- `rawMode: true` でパスワードを送信しているか確認する
- パスワード内の特殊文字(`&`, `!`, `$` 等)がシェルに解釈されていないか確認する
- `rawMode: true` ではコマンドがそのまま送信されるため、通常は問題ない

### ホスト鍵確認が表示された場合

初回接続時のみ表示される。`yes` を `rawMode: true` で送信する:

```
mcp__tmux__execute-command(paneId, command: "yes", rawMode: true)
```

### SSH 接続がタイムアウトする場合

- リモートマシンが起動しているか確認する
- ネットワーク到達性を確認する(`ping` コマンド)
- SSH ポート(22)が開いているか確認する
- ファイアウォール設定を確認する

## Chrome 操作

### "AppleScript からの JavaScript の実行がオフ" エラー

Chrome の設定変更が必要。リモートマシンの Chrome で:

1. メニューバーから「表示」を選択
2. 「デベロッパー」を選択
3. 「Apple Events からの JavaScript を許可」を有効化

この設定は GUI 操作でしか変更できないため、リモートマシンのユーザーに依頼する。

### "active tab of window をanyに設定できません" エラー

アクティブタブの直接削除はできない。代わりに:

- 最後のタブを閉じる: `close tab (count of tabs)`
- 特定番号のタブを閉じる: `close tab N`
- アクティブタブを切り替えてから閉じる

### Chrome が起動していない場合

osascript から `tell application "Google Chrome"` を送ると Chrome が自動起動するが、GUI セッションが必要。SSH 接続先に GUI ログインがない場合は Chrome を使用できない。

### osascript の構文エラー

- AppleScript は `&` を文字列結合に使用するため、シェルの `&&` と競合することがある
- 複数行の AppleScript は `-e` オプションで行ごとに分割する
- シングルクォートとダブルクォートの入れ子に注意する

## tmux MCP

### コマンド結果が取得できない

`rawMode: true` で実行したコマンドは `get-command-result` で結果を取得できない。代わりに `capture-pane` を使用する:

```
mcp__tmux__capture-pane(paneId, lines: "10")
```

### capture-pane の出力が古い

`lines` パラメータを増やしてより多くの履歴を取得するか、少し `sleep` してから再取得する。

### ペインが応答しない

対話的プロンプトで止まっている可能性がある。`C-c` を送信して中断するか、新しいペインを作成する:

```
mcp__tmux__execute-command(paneId, command: "C-c", noEnter: true)
```

## ネットワーク関連

### リモートマシンの Web アプリにアクセスできない

- リモートマシン上でアプリが起動しているか確認する
- `localhost` ではなく実際のIPアドレスを使用する
- ファイアウォールでポートが開いているか確認する
