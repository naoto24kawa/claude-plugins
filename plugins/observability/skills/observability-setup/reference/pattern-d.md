# パターンD: Cloudflare x マイクロサービス

## 構成図

```
各サービス(Pino + OpenTelemetry SDK)
  | ログ + トレース
Workers Logs + Workers Tracing
  | OTLPエクスポート
Axiom
  | エラー率が閾値超過
Axiom アラート
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
| ログ収集 | Pino -> Workers Logs |
| 分散トレース | Workers Tracing + Axiom |
| アラート | Axiom のアラート機能 |
| 承認フロー | Slack Bolt |
| 修復履歴ストア | PostgreSQL (Supabase) |
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

- パターンBと同様に `trace_id` / `span_id` 必須・依存グラフ事前定義・修復履歴ストアのキー設計が必要
- Workers TracingのオープンベータステータスはパターンCと同様。マイクロサービスで複数Workerをまたぐトレースの安定性は特に注意して検証する
- 修復履歴ストアはSupabase。複数サービスからの同時書き込みを考慮してコネクションプーリングを設定する(Supabase TransactionモードのPgBouncer推奨)
