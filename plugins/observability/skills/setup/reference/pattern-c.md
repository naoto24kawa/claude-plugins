# パターンC: Cloudflare x 単一アプリ

## 構成図

```
アプリ(Pino + OpenTelemetry SDK)
  | ログ
Workers Logs
  | トレース(OTLPエクスポート)
Axiom
  | エラー率が閾値超過
Axiom アラート
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
| trace_id | recommended | リクエスト単位の追跡に使う。マイクロサービス移行時にコードを流用できる |
| repair_input | error_log | 単一アプリなのでエラーログ単体で根本原因を特定できる |
| repair_key | component | 単一コンポーネントで完結するため、component + エラー種別のハッシュで十分 |

## 設計上の注意点

- Workers TracingはOTLPエクスポートでAxiomに流す構成
- Workers Tracing自体は2026年3月時点でオープンベータのため、本番投入前に安定性を確認する <!-- 最終確認: 2026-03 -->
- 修復履歴ストアはSupabase(PostgreSQL)。Cloudflare WorkersからHTTPS経由で接続する
