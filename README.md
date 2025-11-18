# Claude Code Plugin Marketplace

Claude Code用のプラグインマーケットプレースです。7つのプラグイン（review、test、git、claude、notion、aws、cloudflare）を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価、動作検証、Git操作、インフラ管理などを自動化します。

## 🚀 クイックスタート

### 前提条件

- [Claude Code](https://claude.com/code) がインストールされていること

### マーケットプレースの追加

```bash
/plugin marketplace add naoto24kawa/claude-plugins
```

### プラグインのインストール

```bash
# コードレビュープラグイン
/plugin install review@naoto24kawa-claude-plugins

# 動作検証プラグイン
/plugin install test@naoto24kawa-claude-plugins

# Git操作プラグイン
/plugin install git@naoto24kawa-claude-plugins

# Claude Code設定レビュープラグイン
/plugin install claude@naoto24kawa-claude-plugins

# Notion連携プラグイン
/plugin install notion@naoto24kawa-claude-plugins

# AWS開発支援プラグイン
/plugin install aws@naoto24kawa-claude-plugins

# Cloudflare開発支援プラグイン
/plugin install cloudflare@naoto24kawa-claude-plugins
```

## 📦 提供プラグイン

### 1. review (v0.1.0)

TypeScript実装コードとテストコードの多角的レビュー

**スキル:**
- `ts-code-review`: TypeScript実装コードレビュー
- `ts-test-code-review`: TypeScriptテストコードレビュー

**エージェント（実装レビュー）:**
- Single Responsibility Principle
- Code for Humans（可読性）
- KISS原則
- Convention over Configuration
- TypeScript型安全性
- 不要ファイル検出

**エージェント（テストレビュー）:**
- AAA Pattern
- Test Double Pattern
- Test Data Builder Pattern
- SOLID Principles for Tests

### 2. test (v0.1.0)

Playwrightによる動作検証

**スキル:**
- `test-with-playwright`: E2Eテスト・動作検証

**MCP:** Playwright MCP サーバー

### 3. git (v0.1.0)

Git worktree の管理

**スキル:**
- `worktree-manage`: Git worktree の作成・管理・クリーンアップ

### 4. claude (v1.0.0)

Claude Code のスキル、エージェント、設定のレビュー

**スキル:**
- `skill-review`: スキルのベストプラクティスレビュー（A-F評価）
- `subagent-review`: サブエージェント実装のレビュー
- `slash-command-review`: スラッシュコマンド実装のレビュー（6観点評価）
- `marketplace-review`: マーケットプレース定義の検証
- `mcp-review`: MCP設定のセキュリティとベストプラクティスレビュー（7観点評価）
- `hooks-review`: Claude Code hooks の設定とレビュー

### 5. notion (v1.0.0)

Notion連携による知識管理とドキュメント作成

**スキル:**
- `knowledge-capture`: 会話をドキュメント化
- `meeting-intelligence`: 会議準備資料作成
- `research-documentation`: リサーチレポート作成
- `spec-to-implementation`: 仕様からタスク化

### 6. aws (v0.1.0)

AWS開発支援とアーキテクチャレビュー

**スキル:**
- `developer`: Lambda、ECS、RDS等の実装・デプロイ
- `research-documentation`: 公式ドキュメント検索・参照
- `review-architecture`: Well-Architected Framework準拠レビュー

**MCP:** AWS Documentation MCP サーバー

### 7. cloudflare (v0.1.0)

Cloudflare開発支援とインフラレビュー

**スキル:**
- `developer`: Workers、Pages、R2等の実装
- `research-resources`: MCP経由のリソース調査
- `review-infrastructure`: パフォーマンス・セキュリティレビュー

**MCP:** Cloudflare Documentation MCP サーバー

## 💡 使い方

### スキルの実行例

```bash
# Review系
/skill review:ts-code-review
/skill review:ts-test-code-review

# Claude系
/skill claude:skill-review
/skill claude:subagent-review
/skill claude:slash-command-review
/skill claude:marketplace-review
/skill claude:mcp-review
/skill claude:hooks-review

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

## 🏗️ アーキテクチャ

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # 7つのプラグイン定義
└── skills/
    ├── aws/                    # AWS開発・レビュー・調査
    ├── cloudflare/             # Cloudflare開発・レビュー・調査
    ├── claude/                 # Claude Code レビュー（6スキル）
    ├── git/                    # Git操作
    ├── notion/                 # Notion連携（4スキル）
    ├── review/                 # コードレビュー
    └── test/                   # 動作検証
```

### Progressive Disclosure パターン

すべてのスキルは以下の原則に従って設計されています：

1. **SKILL.md**: 500行以下の簡潔な定義
2. **詳細情報の外部化**: 長大な情報は別ファイルに分離
3. **必要時のみ参照**: Claude Codeが必要な時だけ詳細ファイルを読み込む
4. **1階層の参照**: 参照の深さは1階層まで（SKILL.md → 詳細ファイル）

## 🛠️ 開発

### 新しいプラグインの追加

1. `.claude-plugin/marketplace.json` の `plugins` 配列に新規エントリを追加
2. プラグイン名（`name`）はケバブケース、短く明確に
3. プラグインに含めるスキル・エージェントを作成
4. MCPサーバーが必要な場合は `skills/<プラグイン名>/.mcp.json` に配置
5. バージョン番号を設定（初回は 0.1.0 推奨）

### 新しいスキルの追加

1. `skills/<プラグイン名>/<スキル名>/` ディレクトリを作成
2. `SKILL.md` を作成（YAML frontmatter必須）
   - `name`: gerund形式またはケバブケース
   - `description`: トリガーワード含有、1024文字以内
3. Progressive Disclosure パターンに従い詳細情報を別ファイルに分離
4. `.claude-plugin/marketplace.json` の該当プラグインの `skills` 配列にパスを追加

### 品質基準

- **スキル命名**: Gerund形式またはケバブケース
- **Description**: 具体的なトリガーワード含有、1024文字以内
- **行数**: メインファイルは500行以下（Progressive Disclosure）
- **参照深度**: 外部ファイル参照は1階層まで
- **検証**: 各ステップに検証とエラーハンドリングを含む
- **一貫性**: 同一プラグイン内のスキル・エージェントで用語・形式を統一

## 🔍 品質保証

このリポジトリ自体が品質保証スキルを使用してレビュー可能です：

```bash
# スキルをレビュー
/skill claude:skill-review

# サブエージェントをレビュー
/skill claude:subagent-review

# スラッシュコマンドをレビュー
/skill claude:slash-command-review

# マーケットプレース定義をレビュー
/skill claude:marketplace-review

# MCP設定をレビュー
/skill claude:mcp-review

# Hooks設定をレビュー
/skill claude:hooks-review
```

## 📚 参照

- [CLAUDE.md](./CLAUDE.md) - プロジェクト詳細とガイドライン
- [Plugin Marketplace](https://docs.claude.com/ja/docs/claude-code/plugin-marketplaces) - 公式ドキュメント
- [Skill authoring best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices) - スキル作成ベストプラクティス

## 📄 ライセンス

このプロジェクトのライセンス情報については、リポジトリを参照してください。

## 🤝 コントリビューション

問題や改善提案がある場合は、GitHubのIssuesまたはPull Requestsをご利用ください。
