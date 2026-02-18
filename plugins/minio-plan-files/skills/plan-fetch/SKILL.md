---
name: plan-fetch
description: This skill should be used when the user asks to "planを取得したい", "キューからplanを受け取りたい", "Agentとして最初のステップを実行したい", "plan-fetchを実行したい", "SQSからメッセージを取得してダウンロードしたい", "planの処理を始めたい". SQSキューから1件のplanを取得し、ダウンロード + pending/→processing/移動 + SQSメッセージ削除を一括で行うAgent側ワークフローの第1ステップ。
user-invocable: true
---

SQSキューからplanを1件取得し、ダウンロード + S3上で `pending/` → `processing/` に移動 + SQSメッセージ削除を一括で行うワークフローの第1ステップ。

## ワークフロー内の位置

```
【Dispatcher】
  plan-submit → pending/ → SQS queue

【Agent】
  plan-fetch ← ここ (SQS受信 + ダウンロード + pending/→processing/ + delete-message)
      ↓ 処理実行
  plan-done → done/      (成功時: S3移動のみ)
  plan-fail → failed/    (失敗時: S3移動のみ)
```

## SQSの役割

SQSは **ファイルの排他取得** のためだけに使用する。plan-fetch が以下を一括で行い、SQSの責務はここで完結する:

1. `receive-message` でメッセージを取得 (他のAgentには見えなくなる)
2. S3からplanファイルをダウンロード
3. S3上で `pending/` → `processing/` に移動
4. `delete-message` でキューからメッセージを削除

VisibilityTimeout (30秒) は plan-fetch がこの一連の処理を完了するための猶予時間。

plan-done / plan-fail は SQS とは無関係に S3 ディレクトリの移動のみを行う。

## スクリプトを使う場合

このスキルの `scripts/plan-fetch.sh` を使うと自動化される:

```bash
# planを1件取得 (ダウンロード + pending/→processing/ + delete-message)
./plan-fetch.sh

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-fetch.sh

# stdout にファイルパスが出力される → 変数にキャプチャして処理に使用
PLAN_FILE=$(./plan-fetch.sh)
cat "$PLAN_FILE"
```

メッセージがなければ exit 0 で正常終了する (ログに "キューにメッセージがありません" と出力)。

## プロジェクト名の決定

以下の優先順位で決定する。ただし fetch 時は **SQS メッセージ本文の `project` フィールドを優先**する (Dispatcher が設定したプロジェクトに正確に移動するため):

1. SQS メッセージ本文の `project` フィールド
2. `s3_key` の先頭セグメント (`<PROJECT>/pending/...` の `<PROJECT>` 部分)
3. 環境変数 `MINIO_SHARED_PLAN_FILES_PROJECT` (ローカルのデフォルト用)

## 手動手順

```bash
alias s3sl='aws --endpoint-url http://<IP>:9000 --profile share s3'
alias sqssl='aws --endpoint-url http://<IP>:9324 --region us-east-1 sqs'

# 1. キューから取得 (最大20秒待機)
MSG=$(sqssl receive-message \
  --queue-url http://<IP>:9324/000000000000/plans \
  --max-number-of-messages 1 \
  --wait-time-seconds 20)

S3_KEY=$(echo $MSG | jq -r '.Messages[0].Body | fromjson | .s3_key')
PROJECT=$(echo $MSG | jq -r '.Messages[0].Body | fromjson | .project')
RECEIPT=$(echo $MSG | jq -r '.Messages[0].ReceiptHandle')
FILENAME=$(basename $S3_KEY)

# 2. ダウンロード (先にダウンロードしてファイルロストを防ぐ)
s3sl cp s3://shared/$S3_KEY ./$FILENAME

# 3. pending/ → processing/ に移動
PROCESSING_KEY="${PROJECT}/processing/${FILENAME}"
s3sl mv s3://shared/$S3_KEY s3://shared/$PROCESSING_KEY

# 4. SQS メッセージを削除
sqssl delete-message \
  --queue-url http://<IP>:9324/000000000000/plans \
  --receipt-handle "$RECEIPT"
```

## 次のステップ

- 処理成功 → `plan-done` スキル (processing/ → done/ のS3移動のみ)
- 処理失敗 → `plan-fail` スキル (processing/ → failed/ のS3移動のみ)
- 状態確認 → `plan-status` スキル

---

出力の冒頭に以下を含めること:
- 決定したプロジェクト名と決定方法
- MinIO / ElasticMQ の起動状態
