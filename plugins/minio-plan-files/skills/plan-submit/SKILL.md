---
name: plan-submit
description: This skill should be used when the user asks to "planファイルを送りたい", "MinIOにアップロードしてキューに投入したい", "Dispatcherとして操作したい", "plan-submitの手順を教えて", "planを投入する", "planをキューに送りたい". planファイルをMinIOのpending/にアップロードしてSQSキューへ送信するDispatcher側の操作手順を提供する。
user-invocable: true
---

planファイルをMinIOにアップロードし、SQSキューへ投入するDispatcher側スキル。

## ワークフロー内の位置

```
【Dispatcher】
  plan-submit ← ここ
      ↓ upload
  shared/<PROJECT>/pending/
      ↓ SQS message
  plans queue

【Agent】
  plan-fetch → processing/ → (処理) → plan-done → done/
                                      → plan-fail → failed/
```

## 事前セットアップ

初回は `minio-setup` スキルでプロジェクト名を設定しておくこと。
ローカル IP の取得:

```bash
ipconfig getifaddr en0
```

## スクリプトを使う場合

このスキルの `scripts/plan-submit.sh` を使うとワンコマンドで完結する:

```bash
# 単体
./plan-submit.sh plan-001.json

# 複数まとめて投入
./plan-submit.sh plan-001.json plan-002.json plan-003.json

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-submit.sh plan-001.json
```

## プロジェクト名の決定

以下の優先順位で決定する (スクリプトと同じロジック):

1. 引数 `$ARGUMENTS` が指定されていればそれを使用する
2. 環境変数 `MINIO_SHARED_PLAN_FILES_PROJECT`
3. git origin の `owner/repo` → `owner-repo` 形式
4. カレントディレクトリ名

決定したプロジェクト名と決定方法を冒頭に明示すること。

## 接続情報

| 項目 | 値 |
|------|----|
| MinIO エンドポイント | `http://<IP>:9000` |
| SQS エンドポイント | `http://<IP>:9324` |
| バケット | `shared` |
| Access Key | `fileshare` |
| Secret Key | `fileshare123` |

AWS CLI プロファイルが未設定の場合は `minio-setup` スキルを参照。

## 手動手順

```bash
alias s3sl='aws --endpoint-url http://<IP>:9000 --profile share s3'
alias sqssl='aws --endpoint-url http://<IP>:9324 --region us-east-1 sqs'

# 1. planファイルを pending/ にアップロード
s3sl cp <ファイル名> s3://shared/<PROJECT>/pending/<ファイル名>

# アップロード確認
s3sl ls s3://shared/<PROJECT>/pending/

# 2. キューにメッセージを送信
sqssl send-message \
  --queue-url http://<IP>:9324/000000000000/plans \
  --message-body '{"s3_key": "<PROJECT>/pending/<ファイル名>", "plan_id": "<任意のID>", "project": "<PROJECT>"}'
```

## 結果の確認

Agentが処理を完了すると `done/` にファイルが移動する:

```bash
# 完了ファイルを確認
s3sl ls s3://shared/<PROJECT>/done/

# 結果ファイルをダウンロード
s3sl cp s3://shared/<PROJECT>/done/<plan-id>-result.json ./
```

ステータス詳細 (pending/processing/done/failed の件数・キュー状態) は `plan-status` スキルを参照。

---

出力の冒頭に以下を含めること:
- 決定したプロジェクト名と決定方法
- MinIO / ElasticMQ の起動状態
