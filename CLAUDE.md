# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

このリポジトリは、Interactive Inc.が提供するClaude Code用のプラグインマーケットプレースです。スキルとエージェントを組み合わせて、コードレビュー、品質評価、改善提案などの高度なタスクを自動化します。

## アーキテクチャ

### ディレクトリ構造

```
.
├── .claude-plugin/          # プラグインマーケットプレース設定
│   └── marketplace.json     # マーケットプレース定義ファイル
├── agents/                  # 専門エージェント定義
│   └── review/             # コードレビュー用エージェント
└── skills/                 # スキル定義
    ├── reviewing-skills/   # スキルレビュー用スキル
    └── reviewing-ts-code/  # TypeScriptコードレビュー用スキル
```

### コンポーネント構成

#### 1. マーケットプレース設定 (.claude-plugin/marketplace.json)
- プラグイン名、バージョン、所有者情報を定義
- エージェントとスキルの参照パスを管理
- 現在のプラグイン: `review-skills` (v0.1.0)

#### 2. エージェント (agents/review/)
専門的なレビュー観点に特化した6つのエージェント：

- **review-srp-reviewer.md**: Single Responsibility Principle（単一責任の原則）評価
- **review-human-code-reviewer.md**: Code for Humans（可読性）評価
- **review-kiss-reviewer.md**: KISS原則（シンプルさ）評価
- **review-coc-reviewer.md**: Convention over Configuration（規約）評価
- **review-typescript-comprehensive.md**: TypeScript型安全性総合評価
- **review-garbage-detector.md**: 不要ファイル・ゴミファイル検出

各エージェントは：
- YAML frontmatterで名前と説明を定義
- 専門分野に特化したレビュー観点を提供
- 統一された報告形式（`../docs/agent-report-format.md`準拠）で結果を出力

#### 3. スキル (skills/)

##### reviewing-skills
Claude Codeスキル自体をレビューするメタスキル：
- `SKILL.md`: スキル定義（YAML frontmatter + 実行手順）
- `CHECKLIST.md`: ベストプラクティスチェックリスト
- `REPORT_TEMPLATE.md`: レビューレポート出力テンプレート
- `EXAMPLES.md`: 良い例・悪い例の具体例

##### reviewing-ts-code
実装コードを多角的にレビューするスキル：
- `SKILL.md`: コードレビューワークフロー定義
- `ANALYSIS_GUIDE.md`: トレードオフ分析手法
- `REPORT_TEMPLATE.md`: 統合レポート形式
- `METRICS.md`: 成功指標の定義
- `EXAMPLES.md`: レビュー結果の具体例

### Progressive Disclosure パターン

すべてのスキルは以下の原則に従って設計されています：

1. **SKILL.md**: 500行以下の簡潔な定義
2. **詳細情報の外部化**: 長大な情報は別ファイルに分離
3. **必要時のみ参照**: Claude Codeが必要な時だけ詳細ファイルを読み込む
4. **1階層の参照**: 参照の深さは1階層まで（SKILL.md → 詳細ファイル）

## マーケットプレースの使用方法

### インストール

```bash
# マーケットプレースを追加
/plugin marketplace add interactive-inc/claude-plugins

# プラグインをインストール
/plugin install review-skills@interactive-claude-plugins
```

### スキルの実行

```bash
# TypeScriptコードをレビュー
/skill reviewing-ts-code

# Claude Codeスキルをレビュー
/skill reviewing-skills
```

## 開発ワークフロー

### 新しいエージェントの追加

1. `agents/<カテゴリ>/` に新しいマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントの専門分野とレビュー観点を記述
4. `.claude-plugin/marketplace.json` の `agents` 配列にパスを追加

### 新しいスキルの追加

1. `skills/<スキル名>/` ディレクトリを作成
2. `SKILL.md` を作成（YAML frontmatter必須）
   - `name`: gerund形式（動詞-ing）、小文字、ハイフン区切り
   - `description`: 具体的なキーワードとトリガーワードを含む
3. 詳細情報を別ファイルに分離（500行制限を守る）
4. `.claude-plugin/marketplace.json` の `skills` 配列にパスを追加

### スキルの品質基準

新しいスキルは以下の基準を満たす必要があります：

- **命名**: Gerund形式（例: reviewing-code, analyzing-performance）
- **Description**: トリガーワード含有、1024文字以内
- **行数**: SKILL.md は500行以下
- **参照**: 外部ファイル参照は1階層まで
- **検証**: 各ステップに検証とエラーハンドリングを含む

## Git ワークフロー

### 現在のステータス
- メインブランチ: `main`
- 削除予定ファイル: `CLAUDE.md`（旧版）、`skills/reviewing-code/` ディレクトリ
- 新規ファイル: `skills/reviewing-ts-code/`（追跡対象外）

### コミット時の注意点
- プラグイン定義（marketplace.json）の変更はバージョン番号の更新を伴う
- スキルやエージェントの追加時は、必ず marketplace.json も更新する
- 削除予定ファイルは次回コミット時に削除される

## プラグインの品質保証

このリポジトリ自体が `reviewing-skills` スキルを使用してレビュー可能です：

```bash
# このリポジトリのスキルをレビュー
/skill reviewing-skills
# 対象: ./skills/reviewing-skills または ./skills/reviewing-ts-code
```

これにより、メタ的にスキルの品質を継続的に改善できます。
