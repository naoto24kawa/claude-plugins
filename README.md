# Claude Code Plugin Marketplace

Claude Code用のプラグインマーケットプレースです。4つのプラグイン (review、claude、notion、github) を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価、GitHubワークフローなどを自動化します。

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

# GitHubワークフロープラグイン
/plugin install github@naoto24kawa-claude-plugins

# MinIO+ElasticMQ プラン共有プラグイン
/plugin install minio-plan-files@naoto24kawa-claude-plugins
```

## 提供プラグイン

### 1. review (v1.0.0)

TypeScript、Hono、React、アーキテクチャの多角的レビュー

**スキル (6つ):**
- `ts-code-review`: TypeScript実装コードレビュー
- `ts-test-code-review`: TypeScriptテストコードレビュー
- `hono-backend-review`: Honoバックエンドレビュー
- `react-code-review`: Reactコードレビュー
- `backend-arch-pattern-review`: バックエンドアーキテクチャパターンレビュー
- `frontend-arch-pattern-review`: フロントエンドアーキテクチャレビュー

**エージェント (32):**

| カテゴリ | エージェント |
|---------|------------|
| TypeScript実装 | SRP、Code for Humans、KISS、CoC、型安全性、不要ファイル検出 |
| テスト | AAA Pattern、Test Double、Test Data Builder、SOLID for Tests |
| Hono | DDD Domain、DDD Context、Event Driven、Microservice、Type Safety、Edge Runtime |
| React | Component Design、Performance、State Management、Accessibility、Testability、shadcn |
| バックエンドアーキテクチャ | Layer Structure、DDD Pattern、Dependency、Frontend Pattern、Cloudflare Config |
| フロントエンドアーキテクチャ | FSD、Router、State、API、Component |

### 2. claude (v2.0.0)

Claude Code 設定ファイルの統合レビュー

**スキル (1つ - 6種類の対象を統合):**
- `claude-config-review`: Claude Code設定の統合レビュー
  - Skills、Sub-agents、MCP、Hooks、Slash commands、Plugins の6種類に対応
  - 公式ドキュメントに基づくA-Fグレード評価
  - 具体的な改善提案を提供

### 3. notion (v1.0.0)

Notion連携による知識管理とドキュメント作成

**スキル (4つ):**
- `knowledge-capture`: 会話をドキュメント化
- `meeting-intelligence`: 会議準備資料作成
- `research-documentation`: リサーチレポート作成
- `spec-to-implementation`: 仕様からタスク化

### 5. minio-plan-files (v1.0.0)

MinIO + ElasticMQ を使った AIエージェント向けプラン共有 & タスクキュー

**スキル (6つ):**
- `minio-setup`: 初回セットアップ (プロジェクト名 / ホストIP を設定)
- `plan-submit`: Dispatcher: planファイルを MinIO にアップロードしてキューに投入
- `plan-fetch`: Agent: SQSキューから plan を取得してダウンロード
- `plan-done`: Agent: plan 処理完了 (processing/ → done/)
- `plan-fail`: Agent: plan 処理失敗 (processing/ → failed/)
- `plan-status`: ステータス確認 & failed plan の再投入 (retry)

### 4. github (v1.0.0)

GitHubワークフローの自動化 (Issue/PR作成)

**スキル (2つ):**
- `create-issue`: Issue を仕様書として作成 (As-Is/To-Be形式、判断経緯記録)
- `create-pr`: Pull Request を技術記録として作成 (技術的決定事項、アーキテクチャ影響)

## 使い方

### スキルの実行例

```bash
# Review系 (6スキル)
/skill review:ts-code-review
/skill review:ts-test-code-review
/skill review:hono-backend-review
/skill review:react-code-review
/skill review:backend-arch-pattern-review
/skill review:frontend-arch-pattern-review

# Claude系 (統合スキル - 6種類の対象に対応)
/skill claude:claude-config-review
# → Skills, Sub-agents, MCP, Hooks, Slash commands, Plugins をレビュー

# Notion系 (4スキル)
/skill notion:knowledge-capture
/skill notion:meeting-intelligence
/skill notion:research-documentation
/skill notion:spec-to-implementation

# GitHub系 (2スキル)
/skill github:create-issue
/skill github:create-pr
```

## アーキテクチャ

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # マーケットプレース定義 (公式形式v3)
└── plugins/
    ├── review/                 # コードレビュー (6スキル、32エージェント)
    │   ├── skills/
    │   └── agents/
    ├── claude/                 # Claude Code設定レビュー (1統合スキル)
    │   └── skills/
    ├── notion/                 # Notion連携 (4スキル)
    │   └── skills/
    └── github/                 # GitHubワークフロー (2スキル)
        ├── skills/
        └── templates/
```

### Progressive Disclosure パターン

すべてのスキルは以下の原則に従って設計されています:

1. **SKILL.md**: 500行以下の簡潔な定義
2. **詳細情報の外部化**: 長大な情報は別ファイルに分離
3. **必要時のみ参照**: Claude Codeが必要な時だけ詳細ファイルを読み込む
4. **1階層の参照**: 参照の深さは1階層まで (SKILL.md → 詳細ファイル)

## 開発

### 新しいプラグインの追加

1. `plugins/<プラグイン名>/` ディレクトリを作成
2. `plugins/<プラグイン名>/skills/` と `plugins/<プラグイン名>/agents/` を作成
3. `.claude-plugin/marketplace.json` の `plugins` 配列に新規エントリを追加:
   ```json
   {
     "name": "plugin-name",
     "description": "Plugin description",
     "version": "1.0.0",
     "author": { "name": "...", "email": "..." },
     "source": "./plugins/plugin-name",
     "category": "productivity"
   }
   ```

### 新しいスキルの追加

1. `plugins/<プラグイン名>/skills/<スキル名>/` ディレクトリを作成
2. `SKILL.md` を作成 (YAML frontmatter必須)
   - `name`: gerund形式またはケバブケース
   - `description`: トリガーワード含有、1024文字以内、三人称形式
   - `allowed-tools`: 使用するツールのリスト
3. Progressive Disclosure パターンに従い詳細情報を別ファイルに分離
4. スキルは `source` ディレクトリから自動検出される

### 新しいエージェントの追加

1. `plugins/<プラグイン名>/agents/` にマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントは `source` ディレクトリの `agents/` から自動検出される

### 品質基準

- **スキル命名**: Gerund形式またはケバブケース
- **Description**: 具体的なトリガーワード含有、1024文字以内、三人称形式
- **行数**: メインファイルは500行以下 (Progressive Disclosure)
- **参照深度**: 外部ファイル参照は1階層まで
- **検証**: 各ステップに検証とエラーハンドリングを含む
- **一貫性**: 同一プラグイン内のスキル・エージェントで用語・形式を統一

## 品質保証

このリポジトリ自体が品質保証スキルを使用してレビュー可能です:

```bash
# Claude Code設定を統合レビュー
/skill claude:claude-config-review
```

claude-config-review スキルは対話的に以下の対象を選択してレビューできます:
- Skills - SKILL.mdファイル
- Sub-agents - サブエージェント定義
- MCP - .mcp.json設定
- Hooks - settings.jsonのhooks設定
- Slash commands - .claude/commands/*.md
- Plugins - marketplace.json

各レビューはA-Fグレード付きで、公式ドキュメントに基づいた具体的な改善提案を提供します。

## 参照

- [CLAUDE.md](./CLAUDE.md) - プロジェクト詳細とガイドライン
- [Plugin Marketplace](https://code.claude.com/docs/en/plugin-marketplaces) - 公式ドキュメント
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - スキル作成ベストプラクティス

## ライセンス

このプロジェクトのライセンス情報については、リポジトリを参照してください。

## コントリビューション

問題や改善提案がある場合は、GitHubのIssuesまたはPull Requestsをご利用ください。
