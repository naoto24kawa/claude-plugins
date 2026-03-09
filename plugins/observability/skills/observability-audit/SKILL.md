---
name: observability-audit
description: This skill should be used when the user asks to "観測系の設定を監査したい", "observability audit", "ログ設計に沿ってるか確認したい", "observability-auditを実行したい", "OTelの導入状況をチェックしたい", "設計ドキュメントとコードの整合性を確認したい", "Pino設定を検証したい". .docs/observability-design.md の設計判断を基準にコードを検査し、OK/WARN/NG のレポートと具体的な修正提案を出力する継続的監査スキル。
allowed-tools: [Read, Glob, Grep]
user-invocable: true
---

# Observability Audit

`.docs/observability-design.md` の設計判断を基準に、プロジェクトのコードが観測系設計に沿っているかを検査するスキル。

## 前提条件

- `observability-setup` で `.docs/observability-design.md` が生成済みであること
- ファイルが存在しない場合: 「先に `observability-setup` を実行して設計を確定してください」と案内して終了

## ワークフロー

### Step 1: 設計ドキュメント読み込み

`.docs/observability-design.md` を Read で読み込み、frontmatter をパースする。

以下の値を取得:
- pattern (A/B/C/D)
- infrastructure (aws/cloudflare)
- architecture (single/microservices)
- trace_id (required/recommended/optional)
- repair_input (error_log/distributed_trace)
- repair_key (component/service_chain)
- git_snapshot (true/false)
- repair_history_rag (true/false)

パターン名を表示: 「パターン X (infrastructure x architecture) で監査します」

### Step 2: コード検査 (パターン共通)

以下を順に検査する。検査方法の詳細は `./reference/audit-checklist.md` を参照。

| ID | 項目 | 検査方法 |
|---|---|---|
| LOG-001 | Pino 導入 | Glob: **/package.json → "pino" を Grep |
| LOG-002 | 構造化JSON出力 | Grep: pino の transport/prettifier 設定 |
| LOG-003 | severity 統一 | Grep: console.log / console.error の残存 |
| TRACE-001 | OTel SDK 導入 | Glob: **/package.json → "@opentelemetry" を Grep |
| TRACE-002 | OTel SDK 初期化 | Grep: NodeSDK or registerInstrumentations |

### Step 3: コード検査 (パターン依存)

frontmatter の値に応じて条件付きで検査する:

| 条件 | ID | 項目 |
|------|---|------|
| trace_id == required | TRACE-003 | trace_id がログ/レスポンスに含まれているか |
| architecture == microservices | TRACE-004 | Context Propagation が有効か |
| repair_input == distributed_trace | TRACE-005 | トレースエクスポーター設定があるか |

条件に該当しない項目はスキップし、レポートに「(対象外)」と記載する。

### Step 4: 設計原則チェック

| ID | 項目 | 検査方法 |
|---|---|---|
| DESIGN-001 | 3層アクション定義 | frontmatter の repair_actions を確認 |
| DESIGN-002 | Gitスナップショット | git_snapshot: true なら手順ドキュメントの存在確認 |
| DESIGN-003 | 修復履歴RAG | repair_history_rag: true なら DB 接続設定を検索 |

### Step 5: レポート出力

以下の形式でレポートを出力する:

```
## Observability Audit Report

Pattern: X (infrastructure x architecture)
Date: YYYY-MM-DD

| カテゴリ | ID | 項目 | 状態 | 備考 |
|---------|-----|------|------|------|
| ログ | LOG-001 | Pino導入 | OK/WARN/NG | 詳細 |
| ... | ... | ... | ... | ... |

### サマリ
- OK: N 項目
- WARN: N 項目
- NG: N 項目

### 推奨アクション (NG/WARN のみ)
1. [NG] TRACE-001: OTel SDK導入 - npm install @opentelemetry/sdk-node
2. [WARN] LOG-002: prettifier - 本番環境では無効化
```

NG が 0 件の場合: 「全項目が設計に準拠しています」と表示。

## reference ファイル

| ファイル | 内容 |
|---------|------|
| ./reference/audit-checklist.md | 全検査項目の詳細定義(検査方法, OK/WARN/NG 基準, 修正提案) |
