---
pattern:          # A / B / C / D
infrastructure:   # aws / cloudflare
architecture:     # single / microservices
trace_id:         # required / recommended / optional
repair_input:     # error_log / distributed_trace
repair_key:       # component / service_chain
repair_actions:
  immediate: []
  approval: []
  proposal_only: []
git_snapshot:       # true / false
repair_history_rag: # true / false
---

# Observability Design

## 選択パターン

- パターン: <!-- pattern -->
- インフラ: <!-- infrastructure -->
- アーキテクチャ: <!-- architecture -->

## 構成図

<!-- setup が選択パターンに応じて埋める -->

## 3差分の設計判断

### trace_id / span_id

- 方針: <!-- trace_id -->
- 理由:

### 修復AIへの入力

- 粒度: <!-- repair_input -->
- 理由:

### 修復履歴ストアのキー設計

- キー構成: <!-- repair_key -->
- 理由:

## 共通原則

### 修復アクション3層

| 層 | アクション | 承認 |
|---|---|---|
| 即時実行 | <!-- immediate --> | 不要 |
| 承認実行 | <!-- approval --> | Slack Boltで承認 |
| 提案のみ | <!-- proposal_only --> | 人間が手動実行 |

### Gitスナップショット

<!-- git_snapshot: true/false とその方針 -->

### RAG修復履歴

<!-- repair_history_rag: true/false とその方針 -->

## ツール構成

| コンポーネント | ツール |
|---|---|
| ログ収集 | |
| 分散トレース | |
| アラート | |
| 承認フロー | |
| 修復履歴ストア | |
| アクション実行 | |
| PR生成 | |
| スナップショット | |
