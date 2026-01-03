# Claude Code Plugin Marketplace

Claude Code用のプラグインマーケットプレースです。3つのプラグイン（review、claude、notion）を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価などを自動化します。

## クイックスタート

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

# Claude Code設定レビュープラグイン
/plugin install claude@naoto24kawa-claude-plugins

# Notion連携プラグイン
/plugin install notion@naoto24kawa-claude-plugins
```

## 提供プラグイン

### 1. review (v0.4.0)

TypeScript、Hono、React、アーキテクチャの多角的レビュー

**スキル（6つ）:**
- `ts-code-review`: TypeScript実装コードレビュー
- `ts-test-code-review`: TypeScriptテストコードレビュー
- `hono-backend-review`: Honoバックエンドレビュー
- `react-code-review`: Reactコードレビュー
- `micro-arch-pattern-review`: マイクロアーキテクチャパターンレビュー
- `frontend-arch-pattern-review`: フロントエンドアーキテクチャレビュー

**エージェント（32）:**

| カテゴリ | エージェント |
|---------|------------|
| TypeScript実装 | SRP、Code for Humans、KISS、CoC、型安全性、不要ファイル検出 |
| テスト | AAA Pattern、Test Double、Test Data Builder、SOLID for Tests |
| Hono | DDD Domain、DDD Context、Event Driven、Microservice、Type Safety、Edge Runtime |
| React | Component Design、Performance、State Management、Accessibility、Testability、shadcn |
| マイクロアーキテクチャ | Layer Structure、DDD Pattern、Dependency、Frontend Pattern、Cloudflare Config |
| フロントエンドアーキテクチャ | FSD、Router、State、API、Component |

### 2. claude (v1.0.0)

Claude Code のスキル、エージェント、設定のレビュー

**スキル（6つ）:**
- `skill-review`: スキルのベストプラクティスレビュー（A-F評価）
- `subagent-review`: サブエージェント実装のレビュー
- `slash-command-review`: スラッシュコマンド実装のレビュー（6観点評価）
- `marketplace-review`: マーケットプレース定義の検証
- `mcp-review`: MCP設定のセキュリティとベストプラクティスレビュー（7観点評価）
- `hooks-review`: Claude Code hooks の設定とレビュー

### 3. notion (v1.0.0)

Notion連携による知識管理とドキュメント作成

**スキル（4つ）:**
- `knowledge-capture`: 会話をドキュメント化
- `meeting-intelligence`: 会議準備資料作成
- `research-documentation`: リサーチレポート作成
- `spec-to-implementation`: 仕様からタスク化

## 使い方

### スキルの実行例

```bash
# Review系
/skill review:ts-code-review
/skill review:ts-test-code-review
/skill review:hono-backend-review
/skill review:react-code-review
/skill review:micro-arch-pattern-review
/skill review:frontend-arch-pattern-review

# Claude系
/skill claude:skill-review
/skill claude:subagent-review
/skill claude:slash-command-review
/skill claude:marketplace-review
/skill claude:mcp-review
/skill claude:hooks-review

# Notion系
/skill notion:knowledge-capture
/skill notion:meeting-intelligence
/skill notion:research-documentation
/skill notion:spec-to-implementation
```

## アーキテクチャ

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # 3つのプラグイン定義
├── review/                     # コードレビュー（6スキル、32エージェント）
├── claude/                     # Claude Code レビュー（6スキル）
└── notion/                     # Notion連携（4スキル）
```

### Progressive Disclosure パターン

すべてのスキルは以下の原則に従って設計されています：

1. **SKILL.md**: 500行以下の簡潔な定義
2. **詳細情報の外部化**: 長大な情報は別ファイルに分離
3. **必要時のみ参照**: Claude Codeが必要な時だけ詳細ファイルを読み込む
4. **1階層の参照**: 参照の深さは1階層まで（SKILL.md → 詳細ファイル）

## 開発

### 新しいプラグインの追加

1. `.claude-plugin/marketplace.json` の `plugins` 配列に新規エントリを追加
2. プラグイン名（`name`）はケバブケース、短く明確に
3. プラグインに含めるスキル・エージェントを作成
4. MCPサーバーが必要な場合は `<プラグイン名>/.mcp.json` に配置
5. バージョン番号を設定（初回は 0.1.0 推奨）

### 新しいスキルの追加

1. `<プラグイン名>/<スキル名>/` ディレクトリを作成
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

## 品質保証

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

## 参照

- [CLAUDE.md](./CLAUDE.md) - プロジェクト詳細とガイドライン
- [Plugin Marketplace](https://docs.claude.com/ja/docs/claude-code/plugin-marketplaces) - 公式ドキュメント
- [Skill authoring best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices) - スキル作成ベストプラクティス

## ライセンス

このプロジェクトのライセンス情報については、リポジトリを参照してください。

## コントリビューション

問題や改善提案がある場合は、GitHubのIssuesまたはPull Requestsをご利用ください。
