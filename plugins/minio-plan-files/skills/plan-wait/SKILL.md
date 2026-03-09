---
name: plan-wait
description: This skill should be used when the user asks to "planの完了を待ちたい", "planが終わったか確認したい", "plan-submitした結果を待機したい", "plan-waitを実行したい", "planの完了を検知したい", "Dispatcherとしてplanの完了を待ちたい". plan-submitしたplanの完了/失敗をSQS通知キューで待機するDispatcher側ワークフロー。
user-invocable: true
---

plan-submitしたplanの完了/失敗をリアルタイムで待機するDispatcher側スキル。plan-done / plan-fail が `plan-notifications` キューに送信する通知メッセージを long-poll で受信して完了検知を行う。

## ワークフロー内の位置

```
【Dispatcher】
  plan-submit → pending/ → plans queue
      ↓
  plan-wait ← ここ (plan-notifications キューを long-poll)
      ↓
  通知受信: done or failed

【Agent (別プロセス)】
  plan-fetch → processing/ → plan-done → done/   + plan-notifications に通知
                             → plan-fail → failed/ + plan-notifications に通知
```

## 通知メッセージフォーマット

plan-done / plan-fail が送信する通知メッセージの構造:

```json
{
  "filename": "plan-001.json",
  "project": "my-project",
  "status": "done",
  "reason": null,
  "s3_key": "my-project/done/plan-001.json",
  "timestamp": "2026-02-18T12:00:00Z"
}
```

- `status`: `"done"` or `"failed"`
- `reason`: 失敗時の理由 (done時は `null`)

## MCP ツールを使う場合

```
plan_wait({ filenames: ["plan-001.json", "plan-002.json"] })
```

- `filenames`: 待機対象のファイル名リスト (plan-submit時に返されるFilename)
- `timeout_seconds`: 最大待機秒数 (省略時: 300秒 = 5分、最大: 600秒)
- `project`: プロジェクト名 (省略時: 自動取得)

## スクリプトを使う場合

このスキルの `scripts/plan-wait.sh` を使うと自動化される:

```bash
# 1つのplanを待機
./plan-wait.sh plan-001.json

# 複数のplanを待機
./plan-wait.sh plan-001.json plan-002.json plan-003.json

# タイムアウト指定 (秒)
PLAN_WAIT_TIMEOUT=600 ./plan-wait.sh plan-001.json

# 環境変数でホストを指定
MINIO_SHARED_PLAN_FILES_HOST=192.168.1.3 ./plan-wait.sh plan-001.json
```

## 動作の詳細

1. `plan-notifications` キューを long-poll (最大20秒間隔) でループ
2. 受信した通知のfilenameが待機対象に一致 → 記録してメッセージ削除
3. 一致しない通知 → 削除せずスキップ (VisibilityTimeout後にキューに戻る)
4. 全filename完了 or タイムアウト → 結果表示

通知送信に失敗してもS3移動は完了しているため、タイムアウトした場合は `plan-status` でS3上の状態を直接確認すること。

## 出力例

```
=== Plan Wait Result ===
  plan-001.json: done (s3://shared/proj/done/plan-001.json)
  plan-002.json: failed (reason: timeout) (s3://shared/proj/failed/plan-002.json)
  plan-003.json: pending (timeout - まだ完了していません)

完了: 1/3, 失敗: 1/3, 未完了: 1/3
```

## 関連スキル

- 投入: `plan-submit` (planをアップロードしてキューに投入)
- 完了: `plan-done` (processing/ → done/ + 完了通知送信)
- 失敗: `plan-fail` (processing/ → failed/ + 失敗通知送信)
- 状態確認: `plan-status` (各プレフィックスの件数表示)
