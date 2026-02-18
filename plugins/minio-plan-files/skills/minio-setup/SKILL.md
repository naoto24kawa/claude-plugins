---
name: minio-setup
description: This skill should be used when the user asks to "MinIOのセットアップをしたい", "MINIO_SHARED_PLAN_FILES_PROJECTを設定したい", "プロジェクトのMinIO設定をしたい", "plan-submit/plan-fetchなどを使う前に設定したい", "minio-setupを実行したい", "接続先URLを設定したい", "MINIO_SHARED_PLAN_FILES_HOSTを設定したい". プロジェクトの MINIO_SHARED_PLAN_FILES_PROJECT と MINIO_SHARED_PLAN_FILES_HOST を .claude/settings.json に書き込む初回セットアップスキル。
user-invocable: true
---

プロジェクトの `MINIO_SHARED_PLAN_FILES_PROJECT` (プロジェクト名) と `MINIO_SHARED_PLAN_FILES_HOST` (接続先IP) を `.claude/settings.json` に設定するスキル。`plan-submit` / `plan-fetch` / `plan-done` / `plan-fail` / `plan-status` を使う前にプロジェクトごとに1回実行する。

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

## .claude/settings.json への書き込み

カレントディレクトリの `.claude/settings.json` を読み込み、以下のキーを追加または更新する:

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
cat .claude/settings.json
```

---

出力に以下を含めること:
- 設定したプロジェクト名と決定方法
- 設定したホストIP
- 設定ファイルのパス (`.claude/settings.json`)
- 「この設定は plan-submit / plan-fetch / plan-done / plan-fail / plan-status で自動的に使用される。引数で上書きも可能。」
