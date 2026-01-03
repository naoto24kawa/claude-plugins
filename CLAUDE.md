# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Claude Code用のプラグインマーケットプレースです。3つのプラグイン（review、claude、notion）を提供し、スキルとエージェントを組み合わせてコードレビュー、品質評価などを自動化します。

## アーキテクチャ

### プラグイン構成（marketplace.json）

| プラグイン | バージョン | スキル数 | エージェント数 | 内容 |
|-----------|-----------|---------|--------------|------|
| review | 0.4.0 | 6 | 32 | TypeScript/Hono/React/アーキテクチャレビュー |
| claude | 1.0.0 | 6 | 0 | Claude Code設定レビュー |
| notion | 1.0.0 | 4 | 0 | Notion連携 |

### ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # プラグイン定義
├── review/                     # コードレビュー（6スキル、32エージェント）
│   ├── ts-code-review/         # TypeScript実装レビュー
│   ├── ts-test-code-review/    # TypeScriptテストレビュー
│   ├── hono-backend-review/    # Honoバックエンドレビュー
│   ├── react-code-review/      # Reactコードレビュー
│   ├── micro-arch-pattern-review/    # マイクロアーキテクチャレビュー
│   └── frontend-arch-pattern-review/ # フロントエンドアーキテクチャレビュー
├── claude/                     # Claude Code設定レビュー（6スキル）
│   ├── skill-review/
│   ├── subagent-review/
│   ├── slash-command-review/
│   ├── marketplace-review/
│   ├── mcp-review/
│   └── hooks-review/
└── notion/                     # Notion連携（4スキル）
    ├── knowledge-capture/
    ├── meeting-intelligence/
    ├── research-documentation/
    └── spec-to-implementation/
```

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
/plugin install review@naoto24kawa-claude-plugins
/plugin install claude@naoto24kawa-claude-plugins
/plugin install notion@naoto24kawa-claude-plugins
```

### スキルの実行例

```bash
# Review系（6スキル）
/skill review:ts-code-review
/skill review:ts-test-code-review
/skill review:hono-backend-review
/skill review:react-code-review
/skill review:micro-arch-pattern-review
/skill review:frontend-arch-pattern-review

# Claude系（6スキル）
/skill claude:skill-review
/skill claude:subagent-review
/skill claude:slash-command-review
/skill claude:marketplace-review
/skill claude:mcp-review
/skill claude:hooks-review

# Notion系（4スキル）
/skill notion:knowledge-capture
/skill notion:meeting-intelligence
/skill notion:research-documentation
/skill notion:spec-to-implementation
```

## 開発ワークフロー

### 新しいプラグインの追加

1. `.claude-plugin/marketplace.json` の `plugins` 配列に新規エントリを追加
2. プラグイン名（`name`）はケバブケース、短く明確に
3. プラグインに含めるスキル・エージェントを作成
4. MCPサーバーが必要な場合は `<プラグイン名>/.mcp.json` に配置
5. バージョン番号を設定（初回は 0.1.0 推奨）

### 新しいスキルの追加

1. `<プラグイン名>/<スキル名>/` ディレクトリを作成
2. `SKILL.md` を作成（YAML frontmatter必須）
   - `name`: gerund形式またはケバブケース（例: developer, worktree-manage）
   - `description`: トリガーワード含有、1024文字以内
3. Progressive Disclosure パターンに従い詳細情報を別ファイルに分離
   - SKILL.md は500行以下
   - 外部ファイル参照は1階層まで
4. `.claude-plugin/marketplace.json` の該当プラグインの `skills` 配列にパスを追加
   - パス形式: `./<プラグイン名>/<スキル名>`

### 新しいエージェントの追加

1. `<プラグイン名>/<スキル名>/agents/` にマークダウンファイルを作成
2. YAML frontmatterで `name` と `description` を定義
3. エージェントの専門分野とレビュー観点を記述
4. `.claude-plugin/marketplace.json` の該当プラグインの `agents` 配列にパスを追加
   - パス形式: `./<プラグイン名>/<スキル名>/agents/<エージェント名>.md`

### 品質基準

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
- パス指定は相対パスで `./` から始める形式を使用
- プラグイン名とディレクトリ構造は一貫性を保つ
- README.mdとCLAUDE.mdの整合性を維持する

## プラグインの品質保証

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

これにより、メタ的にスキル・エージェント・スラッシュコマンドの品質を継続的に改善できます。
