---
name: plan-done
description: This skill should be used when the user asks to "planの処理が完了した", "planを完了にしたい", "processing→doneに移動したい", "plan-doneを実行したい", "結果をアップロードして完了したい", "planを正常終了したい". processing/のplanをdone/に移動するS3ディレクトリ移動のみのAgent側ワークフロー完了ステップ。
user-invocable: true
---

processing/ のplanを done/ に移動するワークフローの完了ステップ。S3ディレクトリの移動のみを行う (SQSは関与しない)。

## ワークフロー内の位置

```
【Agent】
  plan-fetch → processing/ → (処理実行)
                                  ↓ 成功
                              plan-done ← ここ
                                  ↓
                              done/ (S3移動のみ)
```

## スクリプトを使う場合

このスキルの `scripts/plan-done.sh` を使うと自動化される:

```bash
# processing/ に1件だけある場合 (自動検出)
./plan-done.sh

# ファイル名を指定
./plan-done.sh plan-001.json

# 結果ファイルもアップロードして完了
./plan-done.sh plan-001.json result.json

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-done.sh
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

PROJECT="my-project"
FILENAME="plan-001.json"

# processing/ → done/ に移動
s3sl mv s3://shared/${PROJECT}/processing/${FILENAME} \
       s3://shared/${PROJECT}/done/${FILENAME}
```

## 関連スキル

- 取得: `plan-fetch` (SQS受信 + ダウンロード + pending/→processing/ + delete-message)
- 失敗時: `plan-fail` (processing/ → failed/)
- 確認: `plan-status` (各プレフィックスの件数表示)
