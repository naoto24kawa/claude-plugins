# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Claude Code用のプラグインマーケットプレースです。7つのプラグイン（review、test、git、claude、notion、aws、cloudflare）を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価、動作検証、Git操作、インフラ管理などを自動化します。

## アーキテクチャ

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # 7つのプラグイン定義
└── skills/
    ├── aws/                    # AWS開発・レビュー・調査
    │   ├── .mcp.json          # AWS MCP サーバー設定
    │   └── aws-specialist.md  # AWS専門エージェント
    ├── cloudflare/             # Cloudflare開発・レビュー・調査
    │   ├── .mcp.json          # Cloudflare MCP サーバー設定
    │   └── cloudflare-specialist.md
    ├── claude/                 # Claude Code スキル/エージェントレビュー
    │   ├── skill-review/
    │   └── subagent-review/
    ├── git/                    # Git操作
    │   └── worktree-manage/
    ├── notion/                 # Notion連携（4スキル）
    │   ├── knowledge-capture/
    │   ├── meeting-intelligence/
    │   ├── research-documentation/
    │   └── spec-to-implementation/
    ├── review/                 # コードレビュー
    │   ├── ts-code-review/
    │   │   └── agents/        # 実装レビュー用エージェント
    │   └── ts-test-code-review/
    │       └── agents/        # テストレビュー用エージェント
    └── test/                   # 動作検証
        └── test-with-playwright/
            ├── .mcp.json      # Playwright MCP サーバー設定
            └── agents/
```

### プラグイン構成

marketplace.jsonで定義されている7つのプラグイン：

#### 1. review (v0.1.0)
実装コードとテストコードのレビューを行う専門エージェント群を提供：

**エージェント（実装レビュー）:**
- `review-srp-reviewer`: Single Responsibility Principle
- `review-human-code-reviewer`: Code for Humans（可読性）
- `review-kiss-reviewer`: KISS原則
- `review-coc-reviewer`: Convention over Configuration
- `review-typescript-comprehensive`: TypeScript 型安全性
- `review-garbage-detector`: 不要ファイル検出

**エージェント（テストレビュー）:**
- `test-aaa-test-agent`: Arrange-Act-Assert Pattern
- `test-test-double-agent`: Test Double Pattern（Mock、Stub、Fake）
- `test-test-builder-agent`: Test Data Builder Pattern
- `test-solid-test-agent`: SOLID Principles for Tests
- `test-coordinator`: 複数エージェントの結果統合とトレードオフ調整

**スキル:**
- `ts-code-review`: TypeScript実装コードの多角的レビュー
- `ts-test-code-review`: TypeScriptテストコードの多角的レビュー

#### 2. test (v0.1.0)
Playwrightを使用した動作検証：

**エージェント:**
- `playwright-tester`: E2Eテスト・動作検証

**スキル:**
- `test-with-playwright`: Playwright による動作検証

**MCP:** Playwright MCP サーバー (`skills/test/test-with-playwright/.mcp.json`)

#### 3. git (v0.1.0)
Git worktree の管理：

**スキル:**
- `worktree-manage`: Git worktree の作成・管理・クリーンアップ

#### 4. claude (v0.1.0)
Claude Code のスキルとサブエージェントのレビュー：

**スキル:**
- `skill-review`: Claude Codeスキルのレビュー
- `subagent-review`: サブエージェント実装のレビュー

#### 5. notion (v1.0.0)
Notion連携による知識管理とドキュメント作成：

**スキル:**
- `knowledge-capture`: 会話をドキュメント化
- `meeting-intelligence`: 会議準備資料作成
- `research-documentation`: リサーチレポート作成
- `spec-to-implementation`: 仕様からタスク化

#### 6. aws (v0.1.0)
AWS開発支援とアーキテクチャレビュー：

**エージェント:**
- `aws-specialist`: AWS開発支援

**スキル:**
- `developer`: Lambda、ECS、RDS等の実装・デプロイ
- `research-documentation`: 公式ドキュメント検索・参照
- `review-architecture`: Well-Architected Framework準拠レビュー

**MCP:** AWS Documentation MCP サーバー (`skills/aws/.mcp.json`)

#### 7. cloudflare (v0.1.0)
Cloudflare開発支援とインフラレビュー：

**エージェント:**
- `cloudflare-specialist`: Cloudflare開発支援

**スキル:**
- `developer`: Workers、Pages、R2等の実装
- `research-resources`: MCP経由のリソース調査
- `review-infrastructure`: パフォーマンス・セキュリティレビュー

**MCP:** Cloudflare Documentation MCP サーバー (`skills/cloudflare/.mcp.json`)

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

# プラグインをインストール（プラグイン名は正確に指定）
/plugin install review@naoto24kawa-claude-plugins
/plugin install test@naoto24kawa-claude-plugins
/plugin install git@naoto24kawa-claude-plugins
/plugin install claude@naoto24kawa-claude-plugins
/plugin install notion@naoto24kawa-claude-plugins
/plugin install aws@naoto24kawa-claude-plugins
/plugin install cloudflare@naoto24kawa-claude-plugins
```

### スキルの実行例

```bash
# Review系
/skill review:ts-code-review
/skill review:ts-test-code-review

# Claude系
/skill claude:skill-review
/skill claude:subagent-review

# Git系
/skill git:worktree-manage

# AWS系
/skill aws:developer
/skill aws:review-architecture
/skill aws:research-documentation

# Cloudflare系
/skill cloudflare:developer
/skill cloudflare:review-infrastructure
/skill cloudflare:research-resources

# Notion系
/skill notion:knowledge-capture
/skill notion:meeting-intelligence
/skill notion:research-documentation
/skill notion:spec-to-implementation

# Test系
/skill test:test-with-playwright
```

### MCP サーバー連携

AWS、Cloudflare、Test プラグインは、それぞれ専用のMCPサーバーを使用して外部リソースにアクセスします：

- **aws**: `skills/aws/.mcp.json` - AWS公式ドキュメントサーバー
- **cloudflare**: `skills/cloudflare/.mcp.json` - Cloudflareドキュメントサーバー
- **test**: `skills/test/test-with-playwright/.mcp.json` - Playwrightサーバー

プラグインインストール時に自動的に設定されます。

## 開発ワークフロー

### 新しいプラグインの追加

1. `.claude-plugin/marketplace.json` の `plugins` 配列に新規エントリを追加
2. プラグイン名（`name`）はケバブケース、短く明確に
3. プラグインに含めるスキル・エージェントを作成
4. MCPサーバーが必要な場合は `skills/<プラグイン名>/.mcp.json` に配置
5. バージョン番号を設定（初回は 0.1.0 推奨）

### 新しいスキルの追加

1. `skills/<プラグイン名>/<スキル名>/` ディレクトリを作成
2. `SKILL.md` を作成（YAML frontmatter必須）
   - `name`: gerund形式またはケバブケース（例: developer, worktree-manage）
   - `description`: トリガーワード含有、1024文字以内
3. Progressive Disclosure パターンに従い詳細情報を別ファイルに分離
   - SKILL.md は500行以下
   - 外部ファイル参照は1階層まで
4. `.claude-plugin/marketplace.json` の該当プラグインの `skills` 配列にパスを追加
   - パス形式: `./skills/<プラグイン名>/<スキル名>`

### 新しいエージェントの追加

1. `skills/<プラグイン名>/agents/` または `skills/<プラグイン名>/<スキル名>/agents/` にマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントの専門分野とレビュー観点を記述
4. `.claude-plugin/marketplace.json` の該当プラグインの `agents` 配列にパスを追加
   - パス形式: `./skills/<プラグイン名>/<スキル名>/agents/<エージェント名>.md`

### 品質基準

スキル・エージェントは以下の基準を満たす必要があります：

- **スキル命名**: Gerund形式またはケバブケース（例: developer, worktree-manage）
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
- パス指定は相対パスで `./skills/` から始める形式を使用
- プラグイン名とディレクトリ構造は一貫性を保つ

## プラグインの品質保証

このリポジトリ自体が品質保証スキルを使用してレビュー可能です：

```bash
# スキルをレビュー
/skill claude:skill-review

# サブエージェントをレビュー
/skill claude:subagent-review

# TypeScriptコードをレビュー（該当する場合）
/skill review:ts-code-review

# TypeScriptテストコードをレビュー（該当する場合）
/skill review:ts-test-code-review
```

これにより、メタ的にスキル・エージェントの品質を継続的に改善できます。
