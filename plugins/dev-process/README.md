# dev-process

開発プロセス基盤と仕様管理を一括で導入・運用するClaude Codeプラグイン。

## 概要

プロジェクトに対して以下を提供する:

- **開発プロセス基盤**: CLAUDE.md規約、Issue/PRテンプレート、GitHub Actions品質ゲート、ラベル体系
- **仕様書の自動生成**: コードベースから9フェーズで仕様ドキュメントを生成
- **仕様書の差分更新**: PRやブランチの差分から影響するフェーズのみ再実行
- **仕様-コード乖離検出**: 仕様ドキュメントとコードの実態を比較しレポート出力
- **プロセス健全性監査**: インフラ・トレーサビリティ・仕様カバレッジをA-Fスコアで評価

## インストール

```bash
/plugin install dev-process@naoto24kawa-claude-plugins
```

## スキル一覧

| スキル | コマンド | 用途 |
|--------|---------|------|
| setup | `/skill dev-process:dev-process-setup` | プロジェクトに開発プロセス基盤を一括導入 |
| spec-coordinator | `/skill dev-process:spec-coordinator` | コードベースから仕様書を全体生成 |
| spec-update | `/skill dev-process:spec-update` | PR/ブランチ差分から仕様書を部分更新 |
| spec-drift | `/skill dev-process:spec-drift` | 仕様とコードの乖離を検出 |
| process-audit | `/skill dev-process:process-audit` | プロセス全体の健全性を監査 |
| affaan-m-patterns | `/skill dev-process:affaan-m-patterns` | everything-claude-code パターンのレビューと適用 |
| security-review-context | (自動発火) | セキュリティレビューの差分ベース実行を補助 |

## エージェント (9体)

仕様書生成を9フェーズに分割し、各フェーズを専門エージェントが担当する。
spec-coordinator / spec-update から Task tool 経由で自動的に呼び出される。

| Phase | エージェント | 出力ファイル |
|-------|------------|------------|
| 0 | spec-phase0-context | `_context.md` |
| 1 | spec-phase1-overview | `00-overview.md` |
| 2 | spec-phase2-architecture | `01-architecture.md` |
| 3 | spec-phase3-datamodel | `02-data-model.md` |
| 4 | spec-phase4-api | `03-api-specification.md` |
| 5 | spec-phase5-usecases | `04-usecases/` |
| 6 | spec-phase6-rules | `05-business-rules.md` |
| 7 | spec-phase7-nonfunctional | `06-non-functional.md` |
| 8 | spec-phase8-index | `_index.md` |

## ディレクトリ構成

```
dev-process/
├── README.md
├── skills/
│   ├── setup/                  # プロジェクト初回セットアップ
│   │   ├── SKILL.md
│   │   └── generators/         # テンプレートファイル (6種)
│   │       ├── claude-md-rules.md
│   │       ├── issue-template.md
│   │       ├── pr-template.md
│   │       ├── actions-pr-check.md
│   │       ├── actions-weekly.md
│   │       └── labels.md
│   ├── spec-coordinator/       # 仕様書の全体生成
│   │   └── SKILL.md
│   ├── spec-update/            # PR差分による仕様更新
│   │   ├── SKILL.md
│   │   ├── references/
│   │   │   └── file-phase-mapping.md
│   │   └── examples/
│   │       └── example-pr-update.md
│   ├── spec-drift/             # 仕様-コード乖離検出
│   │   └── SKILL.md
│   ├── process-audit/          # プロセス健全性監査
│   │   ├── SKILL.md
│   │   └── checklists/
│   │       ├── infra-health.md
│   │       ├── traceability.md
│   │       └── spec-coverage.md
│   ├── affaan-m-patterns/      # everything-claude-code パターン管理
│   │   └── SKILL.md
│   └── security-review-context/  # セキュリティレビュー差分ベース補助
│       ├── SKILL.md
│       └── references/
│           ├── dismissed-patterns.md
│           └── cloudflare-workers-security.md
├── agents/                     # 9つの仕様生成エージェント
│   ├── spec-phase0-context.md
│   ├── spec-phase1-overview.md
│   ├── spec-phase2-architecture.md
│   ├── spec-phase3-datamodel.md
│   ├── spec-phase4-api.md
│   ├── spec-phase5-usecases.md
│   ├── spec-phase6-rules.md
│   ├── spec-phase7-nonfunctional.md
│   └── spec-phase8-index.md
└── references/                 # スキル間共有リファレンス
    ├── frontmatter-schema.md   # frontmatter 必須/オプションフィールド定義
    ├── spec-template.md        # type別仕様ドキュメントテンプレート (11種)
    └── phase-mapping.md        # Phase-Agent対応表
```

## 推奨ワークフロー

### 1. 初回導入

```
dev-process-setup → spec-coordinator → process-audit
```

1. `dev-process-setup` でプロジェクトにテンプレート・規約・Actionsを導入
2. `spec-coordinator` でコードベースから仕様書を初回生成
3. `process-audit` で導入状態を確認

### 2. 日常運用

```
コード変更 → spec-update → spec-drift (定期)
```

- PRマージ後に `spec-update` で差分を仕様書に反映
- 定期的に `spec-drift` で仕様とコードの乖離をチェック

### 3. 定期監査

```
process-audit (月次推奨)
```

- `process-audit` でインフラ・トレーサビリティ・仕様カバレッジを評価

## 仕様書の出力先

デフォルト: `docs/specs/`

ユーザーがカスタムディレクトリを指定可能。全スキルで統一されたデフォルトを使用する。

## テンプレートオーバーライド

setup スキルで生成されるファイルは、プロジェクト固有のテンプレートで上書きできる:

```
.dev-process/templates/<file>   ← あれば優先
プラグイン内 generators/<file>  ← デフォルト
```

## 仕様ドキュメントのフォーマット

### frontmatter (必須)

```yaml
---
type: feature | api | data-model | screen | batch | integration | overview | architecture | usecase | business-rules | non-functional
title: "日本語タイトル"
area: kebab-case-area
tags: [kebab-case-tag]
doc_status: draft | stable | deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---
```

### doc_status ライフサイクル

```
draft → stable → deprecated
         ↑
         └── draft (大幅改訂時)
```

## エージェント品質ガイドライン

全仕様書生成エージェント (Phase 1-8) に以下の品質基準が組み込まれています:

### 確信度の段階化

| レベル | マーク | 基準 |
|--------|--------|------|
| 確定 | (なし) | コード・設定ファイルから直接確認 |
| 高確信 | `⚠️ 推定` | 複数の間接的証拠から推論 |
| 低確信 | 記載しない | 証拠不十分のため仕様書に含めない |

### 誤抽出パターン

各フェーズに「仕様書に含めるべきでない項目」が定義されています:
- フレームワークのボイラープレートをビジネスロジックと誤認しない
- 開発ツール・テスト専用設定を本番構成と混同しない
- 依存関係の存在だけで「実装済み」と判断しない

## 前提条件

- Claude Code がインストールされていること
- `gh` CLI が認証済みであること (ラベル作成、トレーサビリティ監査で使用)
