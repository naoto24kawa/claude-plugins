---
name: plan-fail
description: This skill should be used when the user asks to "planの処理が失敗した", "planを失敗にしたい", "processing→failedに移動したい", "plan-failを実行したい", "エラーを記録したい", "planを異常終了したい". plan処理の失敗を記録し、S3のprocessing/→failed/に移動してSQSメッセージを削除するAgent側ワークフローの失敗ステップ。
user-invocable: true
---

plan処理の失敗を記録するワークフロー。失敗理由を引数で渡すと後から確認できる。`.current-plan` ステートファイルから情報を読み込む。

## ワークフロー内の位置

```
【Agent】
  plan-fetch → processing/ → (処理実行)
                                  ↓ 失敗
                              plan-fail ← ここ
                                  ↓
                              failed/ + SQS delete-message
                                  ↓ (オプション)
                              plan-status retry → pending/ → 再キュー投入
```

## 前提条件

`plan-fetch` でplanを取得済みであること。
作業ディレクトリに `.current-plan` ステートファイルが存在している必要がある。

## スクリプトを使う場合

このスキルの `scripts/plan-fail.sh` を使うと自動化される:

```bash
# planを失敗にする (processing/ → failed/ に移動)
./plan-fail.sh

# 失敗理由を記録する
./plan-fail.sh "API タイムアウト"
./plan-fail.sh "データ形式エラー: フィールド X が欠如"

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-fail.sh "接続エラー"
```

## 手動手順

```bash
# .current-plan からステートを読み込み
source .current-plan
# → PLAN_S3_KEY, PLAN_RECEIPT_HANDLE が設定される

PROJECT=$(echo $PLAN_S3_KEY | cut -d/ -f1)
FILENAME=$(basename $PLAN_S3_KEY)

# processing/ → failed/ に移動
s3sl mv s3://shared/$PLAN_S3_KEY s3://shared/${PROJECT}/failed/${FILENAME}

# SQS メッセージを削除
sqssl delete-message \
  --queue-url http://<IP>:9324/000000000000/plans \
  --receipt-handle "$PLAN_RECEIPT_HANDLE"
```

## 失敗後の選択肢

- 再投入: `plan-status` スキルで `retry` を実行 → `failed/` → `pending/` → キューに再送信
- 手動確認: `plan-status` スキルで failed 件数を確認

## 関連スキル

- 取得: `plan-fetch` (ワークフローの第1ステップ)
- 完了時: `plan-done` (processing/ → done/)
- 再投入: `plan-status` → `retry`
