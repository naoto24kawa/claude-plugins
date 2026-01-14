# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Claude Code用のプラグインマーケットプレースです。3つのプラグイン (review、claude、notion) を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価などを自動化します。

## アーキテクチャ

### プラグイン構成 (marketplace.json)

| プラグイン | バージョン | スキル数 | エージェント数 | カテゴリ | 内容 |
|-----------|-----------|---------|--------------|----------|------|
| review | 1.0.0 | 6 | 32 | productivity | TypeScript/Hono/React/アーキテクチャレビュー |
| claude | 2.0.0 | 1 | 0 | development | Claude Code設定レビュー (6種類の対象を統合) |
| notion | 1.0.0 | 4 | 0 | productivity | Notion連携 |

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # マーケットプレース定義 (公式形式v3)
└── plugins/
    ├── review/                 # コードレビュープラグイン
    │   ├── skills/             # 6スキル
    │   │   ├── ts-code-review/
    │   │   ├── ts-test-code-review/
    │   │   ├── hono-backend-review/
    │   │   ├── react-code-review/
    │   │   ├── backend-arch-pattern-review/
    │   │   └── frontend-arch-pattern-review/
    │   └── agents/             # 32エージェント (集約)
    ├── claude/                 # Claude Code設定レビュープラグイン
    │   └── skills/
    │       └── claude-config-review/  # 統合スキル (6種類対応)
    └── notion/                 # Notion連携プラグイン
        └── skills/
            ├── knowledge-capture/
            ├── meeting-intelligence/
            ├── research-documentation/
            └── spec-to-implementation/
```

### Progressive Disclosure パターン

すべてのスキルは以下の原則に従って設計されています:

1. **SKILL.md**: 500行以下の簡潔な定義
2. **詳細情報の外部化**: 長大な情報は別ファイルに分離
3. **必要時のみ参照**: Claude Codeが必要な時だけ詳細ファイルを読み込む
4. **1階層の参照**: 参照の深さは1階層まで (SKILL.md → 詳細ファイル)

## マーケットプレースの使用方法

### インストール

```bash
# マーケットプレースを追加
/plugin marketplace add naoto24kawa/claude-plugins

# プラグインをインストール
/plugin install review@naoto24kawa-claude-plugins
/plugin install claude@naoto24kawa-claude-plugins
/plugin install notion@naoto24kawa-claude-plugins
```

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
```

## 開発ワークフロー

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
   - SKILL.md は500行以下
   - 外部ファイル参照は1階層まで
4. スキルは `source` ディレクトリから自動検出される

### 新しいエージェントの追加

1. `plugins/<プラグイン名>/agents/` にマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントの専門分野とレビュー観点を記述
4. エージェントは `source` ディレクトリの `agents/` から自動検出される

### 品質基準

- **スキル命名**: Gerund形式またはケバブケース
- **Description**: 具体的なトリガーワード含有、1024文字以内、三人称形式
- **行数**: メインファイルは500行以下 (Progressive Disclosure)
- **参照深度**: 外部ファイル参照は1階層まで
- **検証**: 各ステップに検証とエラーハンドリングを含む
- **一貫性**: 同一プラグイン内のスキル・エージェントで用語・形式を統一

## Git ワークフロー

### 現在のステータス
- メインブランチ: `main`

### コミット時の注意点
- プラグイン定義 (marketplace.json) の変更はバージョン番号の更新を伴う
- スキルやエージェントは自動検出されるため、marketplace.json への手動追加は不要
- プラグイン名とディレクトリ構造は一貫性を保つ
- README.mdとCLAUDE.mdの整合性を維持する

## プラグインの品質保証

このリポジトリ自体が品質保証スキルを使用してレビュー可能です:

```bash
# Claude Code設定を統合レビュー (Skills, Sub-agents, MCP, Hooks, Commands, Plugins)
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
