# Claude Code Plugin Marketplace

Claude Code用のプラグインマーケットプレース。7つのプラグインで Issue自動処理、プラン共有、通知、観測系設計、開発プロセス基盤、プラグイン開発支援、アクセシビリティ検査を提供する。

## クイックスタート

### 前提条件

- [Claude Code](https://claude.com/code) がインストールされていること

### インストール

```bash
# マーケットプレースを追加
/plugin marketplace add naoto24kawa/claude-plugins

# 必要なプラグインをインストール
/plugin install automation@naoto24kawa-claude-plugins
/plugin install minio-plan-files@naoto24kawa-claude-plugins
/plugin install notify@naoto24kawa-claude-plugins
/plugin install observability@naoto24kawa-claude-plugins
/plugin install dev-process@naoto24kawa-claude-plugins
/plugin install plugin-dev@naoto24kawa-claude-plugins
/plugin install accessibility@naoto24kawa-claude-plugins
```

## プラグイン一覧

### automation (v1.0.0)

GitHub Issueの自動分類・実装・PR作成ワークフロー。

**コマンド (3つ):**
- `/automation:digest-issues` - Issue自動分類・実装・PR作成
- `/automation:plan-issue` - Issue検討・実装計画作成
- `/automation:setup-automation` - 設定ファイルセットアップ

**エージェント (3つ):** browser-check、digest-worker、pr-screenshots

### minio-plan-files (v2.2.0)

MinIO (S3互換) + ElasticMQ (SQS互換) によるAIエージェント間プラン共有キュー。

**スキル (7つ):**

| スキル | 役割 | コマンド |
|--------|------|---------|
| minio-setup | 初回セットアップ | `/skill minio-plan-files:minio-setup` |
| plan-submit | Dispatcher: planをキューに投入 | `/skill minio-plan-files:plan-submit` |
| plan-fetch | Agent: planを取得 | `/skill minio-plan-files:plan-fetch` |
| plan-done | Agent: plan完了 | `/skill minio-plan-files:plan-done` |
| plan-fail | Agent: plan失敗 | `/skill minio-plan-files:plan-fail` |
| plan-wait | Dispatcher: plan完了待機 | `/skill minio-plan-files:plan-wait` |
| plan-status | ステータス確認 & retry | `/skill minio-plan-files:plan-status` |

### notify (v2.0.0)

タスク完了・入力待ち通知 (simple-notify-tools連携)。インストールするだけで Stop/Notification Hook が自動有効化される。

**Hooks (1つ):** Stop + Notification イベントで notify.sh を自動実行

**スキル (1つ):**
- `/skill notify:notify-setup` - 通知テスト、LAN設定、旧設定マイグレーション

### observability (v1.0.0)

AI自己修復システムの観測系設計セットアップと継続監査。

インフラ (AWS/Cloudflare) x アーキテクチャ (単一/マイクロサービス) の4パターンから選択し、設計確定と継続検査を行う。

**スキル (2つ):**
- `/skill observability:setup` - パターン選択 -> 設計確定 -> `.docs/observability-design.md` 出力
- `/skill observability:observability-audit` - 設計ドキュメント基準のコード検査 (11項目、OK/WARN/NG)

詳細: [plugins/observability/README.md](./plugins/observability/README.md)

### dev-process (v2.0.0)

開発プロセス基盤 + 仕様生成/更新/乖離検出/監査。

**スキル (5つ):**

| スキル | コマンド | 用途 |
|--------|---------|------|
| setup | `/skill dev-process:dev-process-setup` | CLAUDE.md規約・テンプレート・Actions導入 |
| spec-coordinator | `/skill dev-process:spec-coordinator` | コードベースから仕様書を全体生成 (9エージェント) |
| spec-update | `/skill dev-process:spec-update` | PR/ブランチ差分から仕様書を部分更新 |
| spec-drift | `/skill dev-process:spec-drift` | 仕様とコードの乖離を検出 |
| process-audit | `/skill dev-process:process-audit` | プロセス全体の健全性をA-Fスコアで監査 |

推奨ワークフロー: `setup -> spec-coordinator -> process-audit` (初回) / `spec-update -> spec-drift` (日常)

詳細: [plugins/dev-process/README.md](./plugins/dev-process/README.md)

### plugin-dev (v1.0.0)

プラグイン開発のエラー自動検知・診断・修正。

**スキル (2つ):**
- `/skill plugin-dev:setup` - 導入確認・動作ガイド
- `/skill plugin-dev:skill-improver` - スキルエラー診断・修正

**エージェント (2つ):** plugindev-syntax-fixer、plugindev-workflow-debugger

Stop Hookによるスキルエラーの自動検知を含む。

### accessibility (v1.0.0)

WCAG 2.2 Level A/AA/AAA 対応の Web アクセシビリティ静的コードレビュー。

**エージェント (1つ):** a11y-reviewer (HTML/JSX/TSX/Vue/Svelte/CSSのa11y検査 + 修正案提示)

詳細: [plugins/accessibility/README.md](./plugins/accessibility/README.md)

## 開発ガイド

### プラグインの追加

1. `plugins/<プラグイン名>/` ディレクトリを作成
2. コンポーネントを配置: `skills/`、`agents/`、`commands/`、`hooks/` (必要なもののみ)
3. `.claude-plugin/marketplace.json` の `plugins` 配列にエントリを追加

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

### スキルの追加

1. `plugins/<プラグイン名>/skills/<スキル名>/SKILL.md` を作成 (YAML frontmatter必須)
2. Progressive Disclosure パターンに従い詳細を `reference/` に分離
3. スキルは `source` ディレクトリから自動検出される

### エージェントの追加

1. `plugins/<プラグイン名>/agents/<エージェント名>.md` を作成 (YAML frontmatter必須)
2. エージェントは `source` ディレクトリの `agents/` から自動検出される

### コマンドの追加

1. `plugins/<プラグイン名>/commands/<コマンド名>.md` を作成
2. コマンドは `source` ディレクトリの `commands/` から自動検出される

### 品質基準

- スキル名: gerund形式またはケバブケース
- Description: トリガーワード含有、1024文字以内、三人称形式
- SKILL.md: 500行以下 (Progressive Disclosure)
- 外部ファイル参照: 1階層まで
- 同一プラグイン内で用語・形式を統一

## 参照

- [CLAUDE.md](./CLAUDE.md) - AI向けプロジェクトコンテキスト
- [Plugin Marketplace](https://code.claude.com/docs/en/plugin-marketplaces) - 公式ドキュメント
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - スキル作成ベストプラクティス

## コントリビューション

問題や改善提案は GitHub Issues / Pull Requests へ。
