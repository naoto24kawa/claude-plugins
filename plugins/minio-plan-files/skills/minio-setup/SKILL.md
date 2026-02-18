---
name: minio-setup
description: This skill should be used when the user asks to "MinIOのセットアップをしたい", "MINIO_SHARED_PLAN_FILES_PROJECTを設定したい", "プロジェクトのMinIO設定をしたい", "plan-submit/plan-fetchなどを使う前に設定したい", "minio-setupを実行したい", "接続先URLを設定したい", "MINIO_SHARED_PLAN_FILES_HOSTを設定したい", "MCPサーバーを設定したい", "mcp-serverをセットアップしたい". プロジェクトの MINIO_SHARED_PLAN_FILES_PROJECT と MINIO_SHARED_PLAN_FILES_HOST を .claude/settings.local.json に書き込み、オプションで MCP サーバーの設定も案内する初回セットアップスキル。
user-invocable: true
---

プロジェクトの `MINIO_SHARED_PLAN_FILES_PROJECT` (プロジェクト名) と `MINIO_SHARED_PLAN_FILES_HOST` (接続先IP) を `.claude/settings.local.json` に設定するスキル。`plan-submit` / `plan-fetch` / `plan-done` / `plan-fail` / `plan-status` を使う前にプロジェクトごとに1回実行する。

## AWS CLI プロファイルの作成

`share` プロファイルが存在するか確認し、なければ作成する。

```bash
aws configure get aws_access_key_id --profile share 2>/dev/null
```

- 値が返ればプロファイルは存在する → スキップ
- エラーまたは空なら以下で作成:

```bash
aws configure set aws_access_key_id fileshare --profile share
aws configure set aws_secret_access_key fileshare123 --profile share
aws configure set region us-east-1 --profile share
aws configure set output json --profile share
```

作成後、結果を表示する:

```bash
aws configure list --profile share
```

credentials は固定値 (`fileshare` / `fileshare123`)。MinIO の `docker-compose.yml` で定義されている `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` と一致させる必要がある。

## ホストIPの取得

```bash
ipconfig getifaddr en0
```

- **同じPCから使う場合**: `localhost` のまま (デフォルト)
- **別のPCから接続する場合**: 上記コマンドで取得したIPを使用

## プロジェクト名の決定

以下の優先順位でプロジェクト名を決定する:

1. 引数 `$ARGUMENTS` が指定されていればそれを使用する
2. git origin の `owner/repo` から `owner-repo` 形式で取得する:

```bash
git remote get-url origin 2>/dev/null \
  | sed 's|.*github\.com[:/]||' \
  | sed 's/\.git$//' \
  | sed 's/\//-/'
```

3. git リポジトリでない場合はカレントディレクトリ名を使用する:

```bash
basename $(pwd)
```

決定したプロジェクト名と決定方法を明示すること。

## .gitignore への追加

プロジェクトの `.gitignore` に `.claude/settings.local.json` が含まれていない場合、追加する:

```
.claude/settings.local.json
```

ルール:
- `.gitignore` が存在しない場合は新規作成する
- 既に記載がある場合は追加しない
- `.claude/settings.local.json` はマシン固有の設定(IPアドレス等)を含むため、リポジトリにコミットしない

## .claude/settings.local.json への書き込み

カレントディレクトリの `.claude/settings.local.json` を読み込み、以下のキーを追加または更新する:

- `env.MINIO_SHARED_PLAN_FILES_PROJECT` - プロジェクト名
- `env.MINIO_SHARED_PLAN_FILES_HOST` - MinIO / ElasticMQ のホストIP

ルール:
- ファイルが存在しない場合は新規作成する
- 既存の他のキーは保持する
- 上記2キーのみ追加・更新する

設定後のファイル例:

```json
{
  "env": {
    "MINIO_SHARED_PLAN_FILES_PROJECT": "<PROJECT>",
    "MINIO_SHARED_PLAN_FILES_HOST": "<IP>"
  }
}
```

`MINIO_SHARED_PLAN_FILES_HOST` を設定すると、各スクリプトの接続先が自動的に以下になる:
- MinIO: `http://<MINIO_SHARED_PLAN_FILES_HOST>:9000`
- ElasticMQ: `http://<MINIO_SHARED_PLAN_FILES_HOST>:9324`

## 設定の確認

```bash
cat .claude/settings.local.json
```

## MCP サーバー (オプション)

プラグインをインストールすれば MCP サーバーが自動的に登録される。依存パッケージ (`npm install`) は初回起動時に自動実行されるため、手動操作は不要。

環境変数は `.claude/settings.local.json` の `env` セクション (上記で設定済み) が自動的に使われる。

### 接続確認

```
/mcp
```

`minio-plan-files` が一覧に表示されていれば成功。

### MCP ツール一覧 (フルネーム)

MCP ツールのフルネームは `mcp__plugin_<plugin>_<server>__<tool>` 形式:

| フルネーム | 説明 |
|-----------|------|
| `mcp__plugin_minio-plan-files_minio-plan-files__plan_status` | 各プレフィックスの件数とキュー状態を確認 |
| `mcp__plugin_minio-plan-files_minio-plan-files__plan_submit` | planをアップロードしてキューに投入 |
| `mcp__plugin_minio-plan-files_minio-plan-files__plan_fetch` | planを取得してコンテンツを直接返す |
| `mcp__plugin_minio-plan-files_minio-plan-files__plan_done` | 処理完了 (processing/→done/) |
| `mcp__plugin_minio-plan-files_minio-plan-files__plan_fail` | 処理失敗 (processing/→failed/) |
| `mcp__plugin_minio-plan-files_minio-plan-files__plan_retry` | failed/のplanを再投入 |

---

出力に以下を含めること:
- AWS CLI プロファイル `share` の状態 (作成済み or 新規作成)
- 設定したプロジェクト名と決定方法
- 設定したホストIP
- 設定ファイルのパス (`.claude/settings.local.json`)
- 「この設定は plan-submit / plan-fetch / plan-done / plan-fail / plan-status で自動的に使用される。引数で上書きも可能。」
- MCP サーバーはプラグインインストール済みなら追加設定不要 (npm install は初回起動時に自動実行) であることを案内する。
