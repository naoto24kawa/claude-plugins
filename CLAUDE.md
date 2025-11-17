# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Claude Code用のプラグインマーケットプレースです。5つのプラグイン群（review-skills、notion-skills、aws-skills、cloudflare-skills、testing-skills）を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価、改善提案、インフラ管理などを自動化します。

## アーキテクチャ

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json     # 5つのプラグイン定義
├── agents/
│   ├── aws-specialist.md
│   ├── cloudflare-specialist.md
│   ├── playwright-tester.md
│   └── review/
│       ├── implementation/   # 実装レビュー用エージェント
│       └── test/            # テストレビュー用エージェント
├── mcpServers/              # MCP サーバー設定
│   ├── .mcp.aws.json
│   ├── .mcp.cloudflare.json
│   └── .mcp.testing.json
└── skills/
    ├── aws/                 # AWS開発・レビュー・調査
    ├── cloudflare/          # Cloudflare開発・レビュー・調査
    ├── claude/              # スキル/サブエージェントレビュー
    ├── notion/              # Notion連携（4スキル）
    ├── review/              # コードレビュー
    └── testing/             # Playwright テスト
```

### コンポーネント構成

#### 1. マーケットプレース設定 (.claude-plugin/marketplace.json)
5つのプラグインを定義：
- **review-skills** (v0.2.0): コードレビュー、スキルレビュー、サブエージェントレビュー
- **notion-skills** (v1.0.0): Notion連携（Knowledge Capture、Meeting Intelligence、Research Documentation、Spec to Implementation）
- **aws-skills** (v0.1.0): AWS開発、アーキテクチャレビュー、ドキュメント調査
- **cloudflare-skills** (v0.1.0): Cloudflare開発、インフラレビュー、リソース調査
- **testing-skills** (v0.1.0): Playwright による動作検証

#### 2. エージェント

##### 実装レビュー用 (agents/review/implementation/)
- **review-srp-reviewer.md**: Single Responsibility Principle
- **review-human-code-reviewer.md**: Code for Humans（可読性）
- **review-kiss-reviewer.md**: KISS原則
- **review-coc-reviewer.md**: Convention over Configuration
- **review-typescript-comprehensive.md**: TypeScript 型安全性
- **review-garbage-detector.md**: 不要ファイル検出

##### テストレビュー用 (agents/review/test/)
- **test-aaa-test-agent.md**: Arrange-Act-Assert Pattern
- **test-test-double-agent.md**: Test Double Pattern（Mock、Stub、Fake）
- **test-test-builder-agent.md**: Test Data Builder Pattern
- **test-solid-test-agent.md**: SOLID Principles for Tests
- **test-coordinator.md**: 複数エージェントの結果統合とトレードオフ調整

##### その他
- **aws-specialist.md**: AWS開発支援
- **cloudflare-specialist.md**: Cloudflare開発支援
- **playwright-tester.md**: Playwright動作検証

#### 3. スキル

##### Review系 (skills/review/, skills/claude/)
- **ts-code-review**: TypeScript実装コードの多角的レビュー
- **ts-test-code-review**: TypeScriptテストコードの多角的レビュー
- **skills-review**: Claude Codeスキルのレビュー
- **subagent-review**: サブエージェント実装のレビュー

##### AWS系 (skills/aws/)
- **developing-aws-solutions**: Lambda、ECS、RDS等の実装・デプロイ
- **reviewing-aws-architecture**: Well-Architected Framework準拠レビュー
- **researching-aws-documentation**: 公式ドキュメント検索・参照

##### Cloudflare系 (skills/cloudflare/)
- **developing-cloudflare-solutions**: Workers、Pages、R2等の実装
- **reviewing-cloudflare-infrastructure**: パフォーマンス・セキュリティレビュー
- **researching-cloudflare-resources**: MCP経由のリソース調査

##### Notion系 (skills/notion/)
- **notion-knowledge-capture**: 会話をドキュメント化
- **notion-meeting-intelligence**: 会議準備資料作成
- **notion-research-documentation**: リサーチレポート作成
- **notion-spec-to-implementation**: 仕様からタスク化

##### Testing系 (skills/testing/)
- **testing-with-playwright**: E2Eテスト・動作検証

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
/plugin marketplace add naoto24kawa/claude-plugins

# プラグインをインストール
/plugin install review-skills@naoto24kawa-claude-plugins
/plugin install aws-skills@naoto24kawa-claude-plugins
/plugin install cloudflare-skills@naoto24kawa-claude-plugins
/plugin install notion-skills@naoto24kawa-claude-plugins
/plugin install testing-skills@naoto24kawa-claude-plugins
```

### スキルの実行例

```bash
# Review系
/skill review-skills:ts-code-review
/skill review-skills:ts-test-code-review
/skill review-skills:skills-review
/skill review-skills:subagent-review

# AWS系
/skill aws-skills:developing-aws-solutions
/skill aws-skills:reviewing-aws-architecture
/skill aws-skills:researching-aws-documentation

# Cloudflare系
/skill cloudflare-skills:developing-cloudflare-solutions
/skill cloudflare-skills:reviewing-cloudflare-infrastructure
/skill cloudflare-skills:researching-cloudflare-resources

# Notion系
/skill notion-skills:notion-knowledge-capture
/skill notion-skills:notion-meeting-intelligence
/skill notion-skills:notion-research-documentation
/skill notion-skills:notion-spec-to-implementation

# Testing系
/skill testing-skills:testing-with-playwright
```

### MCP サーバー連携

AWS、Cloudflare、Testing プラグインは、それぞれ専用のMCPサーバーを使用して外部リソースにアクセスします：

- **aws-skills**: `mcpServers/.mcp.aws.json` - AWS公式ドキュメントサーバー
- **cloudflare-skills**: `mcpServers/.mcp.cloudflare.json` - Cloudflareドキュメントサーバー
- **testing-skills**: `mcpServers/.mcp.testing.json` - Playwrightサーバー

プラグインインストール時に自動的に設定されます。

## 開発ワークフロー

### 新しいエージェントの追加

1. `agents/<カテゴリ>/` に新しいマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントの専門分野とレビュー観点を記述
4. `.claude-plugin/marketplace.json` の `agents` 配列にパスを追加

### 新しいプラグインの追加

1. `.claude-plugin/marketplace.json` の `plugins` 配列に新規エントリを追加
2. プラグインに含めるスキル・エージェントを作成
3. MCPサーバーが必要な場合は `mcpServers/` に設定ファイルを配置
4. バージョン番号を設定（初回は 0.1.0 推奨）

### 新しいスキルの追加

1. `skills/<カテゴリ>/<スキル名>/` ディレクトリを作成
2. `SKILL.md` を作成（YAML frontmatter必須）
   - `name`: gerund形式（例: developing-aws-solutions）
   - `description`: トリガーワード含有、1024文字以内
3. Progressive Disclosure パターンに従い詳細情報を別ファイルに分離
   - SKILL.md は500行以下
   - 外部ファイル参照は1階層まで
4. `.claude-plugin/marketplace.json` の該当プラグインの `skills` 配列にパスを追加

### 新しいエージェントの追加

1. `agents/<カテゴリ>/` に新しいマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントの専門分野とレビュー観点を記述
4. `.claude-plugin/marketplace.json` の該当プラグインの `agents` 配列にパスを追加

### 品質基準

スキル・エージェントは以下の基準を満たす必要があります：

- **スキル命名**: Gerund形式（例: reviewing-code, developing-solutions）
- **Description**: 具体的なトリガーワード含有、1024文字以内
- **行数**: メインファイルは500行以下（Progressive Disclosure）
- **参照深度**: 外部ファイル参照は1階層まで
- **検証**: 各ステップに検証とエラーハンドリングを含む
- **一貫性**: 同一プラグイン内のスキル・エージェントで用語・形式を統一

## Git ワークフロー

### 現在のステータス
- メインブランチ: `main`

### コミット時の注意点
- プラグイン定義（marketplace.json）の変更はバージョン番号の更新を伴う
- スキルやエージェントの追加時は、必ず marketplace.json も更新する
- 削除予定ファイルは次回コミット時に削除される

## プラグインの品質保証

このリポジトリ自体が品質保証スキルを使用してレビュー可能です：

```bash
# スキルをレビュー
/skill review-skills:skills-review

# サブエージェントをレビュー
/skill review-skills:subagent-review

# TypeScriptコードをレビュー（該当する場合）
/skill review-skills:ts-code-review

# TypeScriptテストコードをレビュー（該当する場合）
/skill review-skills:ts-test-code-review
```

これにより、メタ的にスキル・エージェントの品質を継続的に改善できます。
