# パターンB: AWS x マイクロサービス

## 構成図

```
各サービス(Pino + OpenTelemetry SDK)
  | ログ + トレース
CloudWatch Logs + AWS X-Ray
  | エラー率が閾値超過
CloudWatch Alarms
  | 修復AIを起動
修復AI -> RepairLog生成(分散トレース全体を入力)
  | root_cause_serviceを特定してからアクション判断
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
| trace_id | required | サービス間の連鎖を辿らないと根本原因を特定できない |
| repair_input | distributed_trace | エラーログ単体だと根本原因でないサービスに修復アクションを実行するリスクがある |
| repair_key | service_chain | 同じエラーでも連鎖パターンが違えば修復手順が異なる |

## 設計上の注意点

- `trace_id` / `span_id` は必須。OpenTelemetry SDKをすべてのサービスに組み込む
- `blast_radius` の評価にサービス依存グラフが必要。事前に定義しておく
- 修復履歴ストアのキーにサービス間の組み合わせパターンを含める
- SYSTEM_PROMPTに「分散トレースを参照して `root_cause_service` を特定してからアクションを選ぶ」旨を明記する
