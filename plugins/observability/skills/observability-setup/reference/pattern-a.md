# パターンA: AWS x 単一アプリ

## 構成図

```
アプリ(Pino + OpenTelemetry SDK)
  | ログ
CloudWatch Logs
  | エラー率が閾値超過
CloudWatch Alarms
  | 修復AIを起動
修復AI -> RepairLog生成(エラーログ単体を入力)
  |
Slack Bolt(承認フロー)
  | 承認
Temporal(アクション実行・状態管理)
  |
GitHub API + Claude API(PR生成) / インフラ操作 / 設定変更
  | 不可逆アクション前
Git(スナップショット)
```

## ツール構成

| コンポーネント | ツール |
|---|---|
| ログ収集 | Pino -> CloudWatch Logs |
| 分散トレース | AWS X-Ray |
| アラート | CloudWatch Alarms |
| 承認フロー | Slack Bolt |
| 修復履歴ストア | PostgreSQL (Aurora) |
| アクション実行 | Temporal |
| PR生成 | GitHub API + Claude API |
| スナップショット | Git |

## 3差分のデフォルト値

| 項目 | デフォルト | 理由 |
|---|---|---|
| trace_id | recommended | リクエスト単位の追跡に使う。マイクロサービス移行時にコードを流用できる |
| repair_input | error_log | 単一アプリなのでエラーログ単体で根本原因を特定できる |
| repair_key | component | 単一コンポーネントで完結するため、component + エラー種別のハッシュで十分 |

## 設計上の注意点

- `trace_id` はOpenTelemetry SDKで付与しておく(マイクロサービス移行時に流用できる)
- `affected_users` は自前でセッションログから集計するか、RepairLogスキーマから省略する
