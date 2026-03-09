---
name: plan-fail
description: This skill should be used when the user asks to "planの処理が失敗した", "planを失敗にしたい", "processing→failedに移動したい", "plan-failを実行したい", "エラーを記録したい", "planを異常終了したい". processing/のplanをfailed/にS3移動し、plan-notificationsキューに失敗通知を送信するAgent側ワークフロー失敗ステップ。
user-invocable: true
---

processing/ のplanを failed/ に移動するワークフローの失敗ステップ。S3ディレクトリの移動後、plan-notifications キューに失敗通知を送信する。

## ワークフロー内の位置

```
【Agent】
  plan-fetch → processing/ → (処理実行)
                                  ↓ 失敗
                              plan-fail ← ここ
                                  ↓
                              failed/ (S3移動)
                                  ↓
                              plan-notifications (失敗通知送信)
                                  ↓
【Dispatcher】            plan-wait で検知
                                  ↓ (オプション)
                              plan-status retry → pending/ → 再キュー投入
```

## スクリプトを使う場合

このスキルの `scripts/plan-fail.sh` を使うと自動化される:

```bash
# processing/ に1件だけある場合 (自動検出)
./plan-fail.sh

# ファイル名を指定
./plan-fail.sh plan-001.json

# 失敗理由を記録する
./plan-fail.sh plan-001.json "API タイムアウト"

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-fail.sh
```

## 対象ファイルの決定

1. 引数でファイル名が指定されればそれを使用
2. 省略時は `processing/` 内を自動検出:
   - 1件 → そのファイルを対象
   - 0件 → エラー
   - 複数 → エラー (ファイル名の指定が必要)

## 手動手順

```bash
alias s3sl='aws --endpoint-url http://<IP>:9000 --profile share s3'
alias sqssl='aws --endpoint-url http://<IP>:9324 --region us-east-1 sqs'

PROJECT="my-project"
FILENAME="plan-001.json"
REASON="API timeout"

# 1. processing/ → failed/ に移動
s3sl mv s3://shared/${PROJECT}/processing/${FILENAME} \
       s3://shared/${PROJECT}/failed/${FILENAME}

# 2. 失敗通知を送信
sqssl send-message \
  --queue-url http://<IP>:9324/000000000000/plan-notifications \
  --message-body '{"filename":"'${FILENAME}'","project":"'${PROJECT}'","status":"failed","reason":"'${REASON}'","s3_key":"'${PROJECT}/failed/${FILENAME}'","timestamp":"'$(date -u '+%Y-%m-%dT%H:%M:%SZ')'"}'
```

通知送信に失敗してもS3移動は完了済みのため、処理自体に影響はない。

## 失敗後の選択肢

- 再投入: `plan-status retry` → `failed/` → `pending/` → キューに再送信
- 手動確認: `plan-status` で failed 件数を確認

## 関連スキル

- 取得: `plan-fetch` (SQS受信 + ダウンロード + pending/→processing/ + delete-message)
- 完了時: `plan-done` (processing/ → done/ + 完了通知送信)
- 待機: `plan-wait` (Dispatcher側で完了/失敗を検知)
- 再投入: `plan-status retry`
