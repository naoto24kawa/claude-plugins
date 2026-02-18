---
name: plan-done
description: This skill should be used when the user asks to "planの処理が完了した", "planを完了にしたい", "processing→doneに移動したい", "plan-doneを実行したい", "結果をアップロードして完了したい", "planを正常終了したい". plan処理の完了を記録し、S3のprocessing/→done/に移動してSQSメッセージを削除するAgent側ワークフローの完了ステップ。
user-invocable: true
---

plan処理の正常完了を記録するワークフローの完了ステップ。`.current-plan` ステートファイルから情報を読み込む。

## ワークフロー内の位置

```
【Agent】
  plan-fetch → processing/ → (処理実行)
                                  ↓ 成功
                              plan-done ← ここ
                                  ↓
                              done/ + SQS delete-message
```

## 前提条件

`plan-fetch` でplanを取得済みであること。
作業ディレクトリに `.current-plan` ステートファイルが存在している必要がある。

## スクリプトを使う場合

このスキルの `scripts/plan-done.sh` を使うと自動化される:

```bash
# planを完了にする (processing/ → done/ に移動)
./plan-done.sh

# 結果ファイルをアップロードして完了 (done/ に result も保存)
./plan-done.sh result.json

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-done.sh result.json
```

## 手動手順

```bash
# .current-plan からステートを読み込み
source .current-plan
# → PLAN_S3_KEY, PLAN_RECEIPT_HANDLE が設定される

PROJECT=$(echo $PLAN_S3_KEY | cut -d/ -f1)
FILENAME=$(basename $PLAN_S3_KEY)

# processing/ → done/ に移動
s3sl mv s3://shared/$PLAN_S3_KEY s3://shared/${PROJECT}/done/${FILENAME}

# SQS メッセージを削除
sqssl delete-message \
  --queue-url http://<IP>:9324/000000000000/plans \
  --receipt-handle "$PLAN_RECEIPT_HANDLE"
```

## 関連スキル

- 取得: `plan-fetch` (ワークフローの第1ステップ)
- 失敗時: `plan-fail` (processing/ → failed/)
- 確認: `plan-status` (各プレフィックスの件数表示)
