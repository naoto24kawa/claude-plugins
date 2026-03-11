---
name: observability-audit
description: This skill should be used when the user asks to "観測系の設定を監査したい", "observability audit", "audit observability", "check observability compliance", "ログ設計に沿ってるか確認したい", "observability-auditを実行したい", "OTelの導入状況をチェックしたい", "設計ドキュメントとコードの整合性を確認したい", "Pino設定を検証したい", "run observability audit". Inspects code against .docs/observability-design.md design decisions, producing OK/WARN/NG report with actionable fix proposals.
allowed-tools: [Read, Glob, Grep]
user-invocable: true
---

# Observability Audit

`.docs/observability-design.md` の設計判断を基準に、プロジェクトのコードが観測系設計に沿っているかを検査する。

## 前提条件

- `setup` で `.docs/observability-design.md` が生成済みであること
- ファイルが存在しない場合、「先に `setup` を実行して設計を確定してください」と案内して終了する
- 非Node.jsプロジェクト(package.json が存在しない)の場合、LOG-001/TRACE-001 等のパッケージチェックを WARN とし、備考に「package.json なし - 手動確認を推奨」と記載する。可能であれば import 文(`import pino` / `from opentelemetry`)の直接検索で補完する

## ワークフロー

### Step 1: 設計ドキュメント読み込み

`.docs/observability-design.md` を Read で読み込み、frontmatter から以下の値を取得する:

| キー | 値の範囲 | 用途 |
|------|---------|------|
| `pattern` | A / B / C / D | パターン名の表示 |
| `infrastructure` | aws / cloudflare | レポートヘッダ |
| `architecture` | single / microservices | パターン依存チェックの条件 |
| `trace_id` | required / recommended / optional | TRACE-003 の実行条件 |
| `repair_input` | error_log / distributed_trace | TRACE-005 の実行条件 |
| `repair_key` | component / service_chain | レポートに記録 |
| `git_snapshot` | true / false | DESIGN-002 の実行条件 |
| `repair_actions` | immediate / approval / proposal_only の各配列 | DESIGN-001 の検査対象 |
| `repair_history_rag` | true / false | DESIGN-003 の実行条件 |

パターン名を表示する: 「パターン X (infrastructure x architecture) で監査します」

### Step 2: コード検査 (パターン共通)

以下を順に検査する。各項目の OK/WARN/NG 基準と修正提案の詳細は `./reference/audit-checklist.md` を参照する。

| ID | 項目 | 検査方法 |
|---|---|---|
| LOG-001 | Pino 導入 | Glob: `**/package.json` → `"pino"` を Grep |
| LOG-002 | 構造化JSON出力 | Grep: pino の transport / prettifier 設定を検索 |
| LOG-003 | severity 統一 | Grep: `console.log` / `console.error` の残存を検索 |
| TRACE-001 | OTel SDK 導入 | Glob: `**/package.json` → `"@opentelemetry"` を Grep |
| TRACE-002 | OTel SDK 初期化 | Grep: `NodeSDK` または `registerInstrumentations` を検索 |

検査対象ファイルが見つからない場合(package.json がない等)、その項目を WARN とし、備考に「検査対象ファイルなし」と記載する。手動確認を案内する。

### Step 3: コード検査 (パターン依存)

frontmatter の値に応じて条件付きで検査する。条件に該当しない項目はスキップし、レポートに「(対象外)」と記載する。

| 条件 | ID | 項目 | 検査方法 |
|------|---|------|---------|
| `trace_id == required` | TRACE-003 | trace_id 付与 | HTTP ハンドラで trace_id をログまたはレスポンスに含めているか Grep |
| `architecture == microservices` | TRACE-004 | Context Propagation | HTTP クライアントで W3C Trace Context ヘッダを伝播しているか確認 |
| `repair_input == distributed_trace` | TRACE-005 | トレース収集設定 | OTel エクスポーター設定(X-Ray / Axiom OTLP)の存在を確認 |

判定が曖昧な場合(OTel の自動計装に任せているが明示的な出力がない等)は WARN とし、備考に状況を記載する。

### Step 4: 設計原則チェック

| ID | 項目 | 検査方法 | 条件 |
|---|---|---|---|
| DESIGN-001 | 3層アクション定義 | frontmatter の `repair_actions` の各層が空でないか確認 | 常時 |
| DESIGN-002 | Gitスナップショット | `.docs/` 配下にロールバック手順の記載があるか確認 | `git_snapshot == true` |
| DESIGN-003 | 修復履歴RAG | DB 接続設定(PostgreSQL / Supabase)を Grep で検索 | `repair_history_rag == true` |

設計段階で未実装の項目(例: DB 接続設定が未構築)は WARN とし、NG ではなく段階的な改善を促す。

### Step 5: レポート出力

以下の形式でレポートを出力する:

```
## Observability Audit Report

Pattern: X (infrastructure x architecture)
Date: YYYY-MM-DD

| カテゴリ | ID | 項目 | 状態 | 備考 |
|---------|-----|------|------|------|
| ログ | LOG-001 | Pino導入 | OK | pino@8.x detected |
| ログ | LOG-002 | 構造化JSON出力 | WARN | prettifier が本番設定に残っている |
| トレース | TRACE-001 | OTel SDK | NG | 未導入 |
| ... | ... | ... | ... | ... |

### サマリ
- OK: N 項目
- WARN: N 項目
- NG: N 項目
- 対象外: N 項目

### 推奨アクション (NG/WARN のみ、優先度順)
1. [NG] TRACE-001: OTel SDK導入 - `npm install @opentelemetry/sdk-node`
2. [WARN] LOG-002: prettifier - 本番環境では無効化
```

出力ルール:
- NG が 0 件の場合、「全項目が設計に準拠しています」と表示する
- 推奨アクションは NG を先、WARN を後に並べる
- 各アクションに具体的なコマンドまたは修正手順を含める

## reference ファイル

| ファイル | 内容 | 読み込みタイミング |
|---------|------|------------------|
| `./reference/audit-checklist.md` | 全検査項目の詳細定義(検査方法, OK/WARN/NG 基準, 修正提案) | Step 2 開始時 |
