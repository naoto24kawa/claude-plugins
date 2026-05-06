# dev-tools

開発プロセス・仕様管理・並行レビュー・サイト調査を一括で提供するClaude Codeプラグイン。

## 概要

プロジェクトに対して以下を提供する:

- **仕様書の自動生成/更新/乖離検出**: コードベースから9フェーズで仕様ドキュメントを生成・管理
- **並行エキスパートレビュー**: 5名の専門レビュアーを並行ディスパッチし、指摘0件になるまで繰り返す
- **Webサイト定期調査**: サイクル管理付きのWebサイト探索・変更検知

## インストール

```bash
/plugin install dev-tools@naoto24kawa-claude-plugins
```

## スキル一覧

| スキル | 発動キーワード例 | 用途 |
|--------|----------------|------|
| `spec` | 「仕様書を生成して」「仕様書を更新して」「仕様の乖離を検出して」 | 仕様書のGenerate/Update/Driftを自然言語で自動判別 |
| `parallel-review-cycle` | 「5人の専門家にレビューしてもらおう」「指摘が0になるまでレビュー」 | 5ロール並行レビューサイクルを自律実行 |

### spec スキルの3モード

| モード | 発動条件 | 説明 |
|--------|---------|------|
| Generate | 「仕様書を生成して」「初回生成」 | コードベースから9フェーズ全体生成 |
| Update | 「仕様書を更新して」「PRに合わせて更新」 | PR/ブランチ差分から影響フェーズのみ再実行 |
| Drift | 「乖離を検出して」「仕様とコードを比較して」 | 仕様ドキュメントとコードの実態を比較レポート |

## コマンド一覧

| コマンド | 用途 |
|---------|------|
| `/site-explorer` | Webサイトの定期サイクル調査（変更検知・Issue管理付き） |

## エージェント一覧

### 仕様書生成エージェント（spec スキルから自動呼び出し）

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

### サイト調査エージェント（site-explorer コマンドから自動呼び出し）

| エージェント | 用途 |
|------------|------|
| site-explorer | Phase 0-5 サイクルでWebサイトを定期調査 |

## ディレクトリ構成

```
dev-tools/
├── README.md
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── site-explorer.md        # /site-explorer コマンド定義
├── agents/                     # spec 9フェーズ + site-explorer エージェント
│   ├── site-explorer.md
│   ├── spec-phase0-context.md
│   ├── spec-phase1-overview.md
│   ├── spec-phase2-architecture.md
│   ├── spec-phase3-datamodel.md
│   ├── spec-phase4-api.md
│   ├── spec-phase5-usecases.md
│   ├── spec-phase6-rules.md
│   ├── spec-phase7-nonfunctional.md
│   └── spec-phase8-index.md
├── skills/
│   ├── spec/
│   │   └── SKILL.md            # Generate/Update/Drift 統合スキル
│   └── parallel-review-cycle/
│       ├── SKILL.md
│       └── references/
│           ├── fp-registry-format.md
│           └── specialist-roles.md
└── references/                 # スキル・エージェント共有リファレンス
    ├── config-template.md      # site-explorer 設定テンプレート
    ├── file-phase-mapping.md   # ファイルパスとフェーズのマッピング (Update モード用)
    ├── frontmatter-schema.md   # 仕様ドキュメント frontmatter スキーマ
    ├── phase-mapping.md        # Phase-Agent 対応表
    └── spec-template.md        # type 別仕様ドキュメントテンプレート
```

## 推奨ワークフロー

### 仕様書管理

```
初回: 「仕様書を生成して」→ spec (Generate モード) → 9フェーズで全体生成
更新: 「PRに合わせて仕様書を更新して」→ spec (Update モード) → 差分フェーズのみ再実行
監査: 「仕様とコードの乖離を確認して」→ spec (Drift モード) → 乖離レポート生成
```

### コードレビュー

```
「5人の専門家にレビューしてもらおう」→ parallel-review-cycle → 全員LGTM まで自律実行
```

### Webサイト調査

```
/site-explorer → Phase 0-5 サイクル → 変更検知・GitHub Issue 管理・レポート生成
```

## 仕様書の出力先

デフォルト: `docs/specs/`

ユーザーがカスタムディレクトリを指定可能。

## 仕様ドキュメントのフォーマット

### frontmatter（必須）

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

### 確信度の段階化

| レベル | マーク | 基準 |
|--------|--------|------|
| 確定 | (なし) | コード・設定ファイルから直接確認 |
| 高確信 | `⚠️ 推定` | 複数の間接的証拠から推論 |
| 低確信 | 記載しない | 証拠不十分のため仕様書に含めない |
