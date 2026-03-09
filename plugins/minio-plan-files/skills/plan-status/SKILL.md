---
name: plan-status
description: This skill should be used when the user asks to "planのステータスを確認したい", "どのplanが処理中か確認したい", "failed planを再投入したい", "plan-statusを実行したい", "キューの状態を確認したい", "failedをretryしたい". 各S3プレフィックス(pending/processing/done/failed)の件数とキュー状態を表示し、failedなplanをpendingに再投入するユーティリティ。
user-invocable: true
---

各S3プレフィックスのplan件数とキュー状態を表示するユーティリティ。failed planの再投入 (`retry`) も担う。

## ワークフロー内の位置

```
  pending/    ← plan-submit が投入 / plan-status retry が再投入
  processing/ ← plan-fetch が移動
  done/       ← plan-done が移動
  failed/     ← plan-fail が移動 → plan-status retry で pending/ に戻せる

  plan-status ← ここ (どこからでも呼べる確認ユーティリティ)
```

## スクリプトを使う場合

このスキルの `scripts/plan-status.sh` を使うと自動化される:

```bash
# ステータス一覧を表示
./plan-status.sh

# failed/ → pending/ に再投入してキューに送信
./plan-status.sh retry

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-status.sh
```

**出力例:**
```
=== Plan Status: my-project ===
  pending/     3 件
  processing/  1 件
  done/        12 件
  failed/      0 件

=== Queue ===
  待機中 (visible):   3 件
  処理中 (invisible): 1 件
```

## 手動手順

```bash
alias s3sl='aws --endpoint-url http://<IP>:9000 --profile share s3'
alias sqssl='aws --endpoint-url http://<IP>:9324 --region us-east-1 sqs'

# ステータス確認
for dir in pending processing done failed; do
  echo -n "${dir}/: "
  s3sl ls s3://shared/<PROJECT>/${dir}/ 2>/dev/null | wc -l
done

# キュー確認
sqssl get-queue-attributes \
  --queue-url http://<IP>:9324/000000000000/plans \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible
```

## 関連スキル

- 投入: `plan-submit` (pending/ にアップロード + キュー送信)
- 取得: `plan-fetch` (pending/ → processing/)
- 完了: `plan-done` (processing/ → done/ + 完了通知送信)
- 失敗: `plan-fail` (processing/ → failed/ + 失敗通知送信)
- 待機: `plan-wait` (Dispatcher側で完了/失敗をリアルタイム検知)
