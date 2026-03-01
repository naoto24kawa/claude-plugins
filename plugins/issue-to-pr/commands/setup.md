---
description: 'issue-to-pr プラグインの設定ファイルをセットアップする'
---

# issue-to-pr セットアップ

`.claude/issue-to-pr.local.json` を対話的に作成・更新する。

## 手順

### 1. 既存設定の確認

`.claude/issue-to-pr.local.json` を Read tool で読む。

- ファイルが存在する場合: 現在の設定を表示し、「更新しますか?」と確認する
- ファイルが存在しない場合: 新規作成として進む

### 2. CLAUDE.md から自動検出

CLAUDE.md を Read tool で読み、以下の値を推測する:

- テストコマンド (例: `yarn test`, `npm test`, `bun test`)
- dev サーバーポート (例: 9081, 3000, 5173)
- テストユーザー情報 (email, password)
- GraphQL エンドポイント
- Slack チャンネル ID (通知設定セクション)

### 3. 対話的に設定値を確認

AskUserQuestion で以下を一括確認する。CLAUDE.md から検出できた値はデフォルト候補として提示する。

質問項目:

1. **test_command** - テスト実行コマンド
2. **dev_server_port** - dev サーバーポート
3. **test_user** - テストユーザー (email / password)
4. **graphql_endpoint** - GraphQL エンドポイント
5. **slack_channel** - Slack 通知先チャンネル ID (空欄で通知なし)
6. **related_repos** - 関連リポジトリ (nameWithOwner: localPath の組)

関連リポジトリが必要かを確認し、必要な場合は nameWithOwner とローカルパスを入力してもらう。

### 4. 設定ファイルの書き込み

`.claude/` ディレクトリが存在しない場合は作成する。

確認した値で `.claude/issue-to-pr.local.json` を Write tool で書き込む:

```json
{
  "slack_channel": "<値または省略>",
  "dev_server_port": <数値>,
  "test_command": "<コマンド>",
  "test_user": {
    "email": "<email>",
    "password": "<password>"
  },
  "graphql_endpoint": "<URL>",
  "related_repos": {
    "<nameWithOwner>": "<localPath>"
  }
}
```

値が空の項目はキーごと省略する。

### 5. .gitignore の確認

`.gitignore` を Read tool で読み、`.claude/*.local.json` または `.claude/issue-to-pr.local.json` が含まれているか確認する。

- 含まれていない場合: `.gitignore` に `.claude/*.local.json` を追加する
- 含まれている場合: そのまま

### 6. 完了メッセージ

書き込んだ設定を表示して完了を報告する。
