# Observability Plugin 設計ドキュメント

## 概要

個人開発プロジェクトで毎回同じ観測系パターンを再現するための Claude Code プラグイン。
「AIアプリ自己修復 観測系構成ガイド」をスキルとして組み込み、設計の初期確定と継続的な監査を行う。

## 背景

- 観測系構成ガイドで定義された4パターン(AWS/CF x 単一/マイクロ)を個人開発で毎回適用したい
- パターン選択後の設計判断(3差分)を標準化し、再現性を高めたい
- 初期設計だけでなく、開発中に設計との乖離を検出・修正したい

## プラグイン構成

```
plugins/observability/
├── skills/
│   ├── setup/       # 初回セットアップスキル
│   │   ├── SKILL.md
│   │   ├── reference/
│   │   │   ├── pattern-a.md       # AWS x 単一アプリ
│   │   │   ├── pattern-b.md       # AWS x マイクロサービス
│   │   │   ├── pattern-c.md       # CF x 単一アプリ
│   │   │   ├── pattern-d.md       # CF x マイクロサービス
│   │   │   └── pino-otel-setup.md # Pino/OTel導入リファレンス
│   │   └── templates/
│   │       └── observability-design.md  # 設計ドキュメントテンプレート
│   └── observability-audit/       # 継続的な監査スキル
│       ├── SKILL.md
│       └── reference/
│           └── audit-checklist.md  # 検査項目の詳細定義
```

## スキル1: setup

### 目的

プロジェクト初期に観測系の設計判断を対話的に確定し、設計ドキュメントを出力する。

### フロー

```
Step 1: インフラ選択
  → AWS / Cloudflare

Step 2: アーキテクチャ選択
  → 単一アプリ / マイクロサービス
  → パターン A-D が自動決定

Step 3: 3差分の設計確定
  → trace_id/span_id の方針 (required / recommended / optional)
  → 修復AIへの入力粒度 (error_log / distributed_trace)
  → 修復履歴ストアのキー設計 (component / service_chain)

Step 4: 共通原則の確認
  → 修復アクション3層の定義
  → Gitスナップショット方針
  → RAG修復履歴の要否

Step 5: 設計ドキュメント出力
  → .docs/observability-design.md に保存
```

### 出力: 設計ドキュメントスキーマ

```yaml
# .docs/observability-design.md の frontmatter
pattern: A              # A / B / C / D
infrastructure: aws     # aws / cloudflare
architecture: single    # single / microservices
trace_id: recommended   # required / recommended / optional
repair_input: error_log # error_log / distributed_trace
repair_key: component   # component / service_chain
repair_actions:
  immediate: [restart, cache_clear]
  approval: [pr_merge, scale_up]
  proposal_only: [infra_change, db_migration]
git_snapshot: true
repair_history_rag: true
```

### reference ファイル

各パターンの詳細(構成図、設計上の注意点、ツール構成)を格納。
元のガイドからパターン別に分割して配置する。

## スキル2: observability-audit

### 目的

開発中に、選択したパターンの設計に沿っているかコードを検査し、乖離を検出・修正提案する。

### フロー

```
Step 1: 設計ドキュメント読み込み
  → .docs/observability-design.md の frontmatter をパース
  → なければ「先に setup を実行してください」で終了

Step 2: コード検査 (パターン共通)
  → Pino 導入チェック (package.json / import)
  → OpenTelemetry SDK 導入チェック
  → 構造化ログ形式の確認 (JSON出力, severity統一)

Step 3: コード検査 (パターン依存)
  → trace_id が required なら: 全HTTPハンドラで付与されているか
  → microservices なら: サービス間でcontext propagationしているか
  → repair_input が distributed_trace なら: トレース収集設定があるか

Step 4: 設計原則チェック
  → 修復アクション3層が定義されているか
  → 不可逆アクション前のGitスナップショット手順があるか
  → repair_history_rag: true なら修復履歴ストアの接続設定があるか

Step 5: レポート出力
  → 項目ごとに OK / WARN / NG を判定
  → NG項目に対して具体的な修正提案を提示
```

### レポート形式

```markdown
## Observability Audit Report

Pattern: A (AWS x 単一アプリ)

| カテゴリ | ID | 項目 | 状態 | 備考 |
|---------|-----|------|------|------|
| ログ | LOG-001 | Pino導入 | OK | pino@8.x detected |
| ログ | LOG-002 | 構造化JSON出力 | WARN | prettifier が本番設定に残っている |
| トレース | TRACE-001 | OTel SDK | NG | 未導入 |
| 設計原則 | DESIGN-001 | 3層アクション定義 | OK | .docs/observability-design.md |
| 設計原則 | DESIGN-002 | Gitスナップショット | WARN | 手順ドキュメントなし |

### 推奨アクション
1. [NG] OTel SDK導入 — @opentelemetry/sdk-node を追加
2. [WARN] Pino prettifier — 本番環境では無効化
```

### 検査項目の分類

| 分類 | 検査対象 | 検査方法 |
|------|---------|---------|
| パターン共通 | Pino導入, OTel SDK, 構造化ログ | package.json + import grep |
| パターン依存 | trace_id付与, context propagation | HTTPハンドラ grep |
| 設計原則 | 3層定義, Gitスナップショット, RAG | .docs/ + コード検索 |

## 2スキル間の連携

```
setup (初回)
  → .docs/observability-design.md 出力

observability-audit (繰り返し)
  → .docs/observability-design.md 読み込み
  → コードとの整合性を検査
  → 乖離があれば修正提案
```

連携ポイントは `.docs/observability-design.md` の1ファイルのみ。
frontmatter のスキーマが2スキル間の契約(contract)となる。

## marketplace.json への追加

```json
{
  "name": "observability",
  "description": "AI self-healing system observability design setup and continuous audit. Guides pattern selection (AWS/Cloudflare x single/microservices), confirms trace_id/repair design decisions, and audits code compliance against the design document.",
  "version": "1.0.0",
  "author": { "name": "naoto24kawa", "email": "naoto24kawa@gmail.com" },
  "source": "./plugins/observability",
  "category": "productivity"
}
```

## 設計判断の記録

| 判断 | 選択 | 理由 |
|------|------|------|
| スキル分割 | 2スキル分離型 | Setup(初回)とAudit(繰り返し)はライフサイクルが異なる |
| Audit範囲 | コード + 設計ドキュメント整合性 | Claude Codeで検査可能な範囲に限定。ライブインフラは対象外 |
| 連携方式 | frontmatter契約 | 1ファイルのスキーマで2スキルを疎結合に連携 |
| パターン詳細 | reference/ に外部化 | Progressive Disclosure。SKILL.md を300行以下に保つ |
