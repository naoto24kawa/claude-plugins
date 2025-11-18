# hooks-review

Claude Code hooks の設定を検証し、セキュリティ、パフォーマンス、ベストプラクティスに基づいて包括的なレビューを提供するスキルです。

## 概要

このスキルは、Claude Code の hooks 設定（PreToolUse、PostToolUse、UserPromptSubmit など）を分析し、セキュリティ脆弱性、パフォーマンス問題、正確性の問題を特定します。新しい hooks の作成支援、既存設定のレビュー、トラブルシューティングガイダンスを提供します。

## インストール

### 前提条件

Claude Code CLI がインストールされている必要があります。

### マーケットプレースの追加

```bash
/plugin marketplace add naoto24kawa/claude-plugins
```

### プラグインのインストール

```bash
/plugin install claude@naoto24kawa-claude-plugins
```

## 主な機能

### 1. Hooks 設定レビュー

既存の hooks 設定を分析し、以下を特定：

- **セキュリティ脆弱性**: コマンドインジェクション、引用されていない変数、露出したシークレット
- **パフォーマンス問題**: タイムアウトの欠如、非効率なパターン
- **正確性の問題**: 不適切な終了コード、不正な JSON
- **ベストプラクティス違反**
- **最適化の機会**

### 2. Hooks 作成とセットアップ

一般的なシナリオに対する新しい hooks 設定の作成をガイド：

- 書き込み時のコードフォーマット（PreToolUse for Write/Edit）
- コミット前のセキュリティスキャン（PreToolUse for Bash with git）
- テスト実行の検証（PostToolUse）
- セッションログと分析（SessionStart/SessionEnd）
- カスタム通知統合（Notification）

### 3. Hooks 検証とテスト

Hooks 設定が正しく動作することを確認：

- JSON 構造と必須フィールドの検証
- イベント/マッチャーの組み合わせチェック
- スクリプトパスの存在と実行可能性の確認
- 環境変数の適切な引用確認
- タイムアウト値の適切性確認
- 終了コード処理ロジックのテスト

### 4. ベストプラクティスガイダンス

Hooks のベストプラクティスについての教育：

- **セキュリティ**: 入力検証、絶対パス、シークレット保護
- **パフォーマンス**: 適切なタイムアウト、並列実行の理解
- **信頼性**: エラーハンドリング、終了コード、JSON 出力形式
- **保守性**: 明確な命名、ドキュメント、バージョン管理

## 使用タイミング

このスキルは以下のような場合に使用します：

- Hooks 設定のレビューが必要な時（"Review my hooks configuration", "Check my hooks for issues"）
- 新しい hooks を作成したい時（"Create a hook to format code", "Set up a pre-commit hook"）
- Hooks のトラブルシューティングが必要な時（"Why isn't my hook working?", "Debug hook errors"）
- ベストプラクティスを学びたい時（"What are hooks best practices?", "How to secure my hooks?"）
- 特定のイベントについて知りたい時（PreToolUse、PostToolUse、SessionStart など）

## ファイル構成

```
skills/claude/hooks-review/
├── README.md                          # このファイル
├── SKILL.md                           # メインスキル定義
├── references/                        # 詳細リファレンス
│   ├── hooks-guide.md                # 包括的な hooks ドキュメント
│   ├── review-checklist.md           # 評価基準
│   └── review-report-template.md     # レビューレポートテンプレート
└── assets/                            # テンプレート集
    └── hooks-templates/              # すぐに使えるテンプレート
        ├── pre-write-format.json
        ├── pre-commit-validation.json
        ├── session-logging.json
        └── secret-protection.json
```

## 使い方

### 基本的な使用方法

1. **スキルの呼び出し**
   ```
   「hooks-review スキルを使って設定をレビューしてください」
   ```

2. **対象ファイルの指定**
   - `~/.claude/settings.json` (ユーザー全体)
   - `.claude/settings.json` (プロジェクト固有、バージョン管理)
   - `.claude/settings.local.json` (ローカルオーバーライド、git-ignored)

3. **レビュー結果の確認**
   - セキュリティ評価
   - パフォーマンス評価
   - 優先度別の改善提案
   - 具体的な修正例

### Hook イベント一覧

| イベント | トリガータイミング | 一般的な用途 |
|---------|----------------|-------------|
| `PreToolUse` | ツール実行前 | 検証、セキュリティチェック、フォーマット |
| `PostToolUse` | ツール実行後 | 確認、通知、クリーンアップ |
| `UserPromptSubmit` | ユーザー入力送信時 | 入力検証、ロギング |
| `Stop` | メインエージェント停止時 | 分析、クリーンアップ |
| `SubagentStop` | サブエージェント停止時 | タスク完了追跡 |
| `SessionStart` | セッション開始時 | 初期化、環境セットアップ |
| `SessionEnd` | セッション終了時 | クリーンアップ、レポート |
| `Notification` | 通知送信時 | カスタム統合 |
| `PreCompact` | コンテキスト圧縮前 | 状態保存 |

## 設定ファイルの場所

Hooks は3つの場所で設定可能（優先順位順にマージ）：

1. **`~/.claude/settings.json`** - ユーザー全体のグローバル hooks
2. **`.claude/settings.json`** - プロジェクト固有の hooks（バージョン管理）
3. **`.claude/settings.local.json`** - ローカルオーバーライド（git-ignored）

## セキュリティ考慮事項

Hooks のレビューや作成時に常に強調するセキュリティ原則：

1. **入力を決して信頼しない** - JSON 入力構造を常に検証
2. **絶対パスを使用** - PATH 依存のスクリプト参照を避ける
3. **シェル変数を引用** - インジェクション防止: `"$VARIABLE"` であり `$VARIABLE` ではない
4. **シークレットを保護** - `.env` ファイルや認証情報をコミットしない
5. **権限を制限** - 必要最小限のアクセス権を使用
6. **タイムアウトを設定** - 無期限ハングを防ぐ（デフォルト: 60秒）

## 依存関係

### 必須要件

**jq** - JSON 処理ツール（シェルスクリプトテンプレートで使用）

インストール:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Fedora/RHEL
sudo dnf install jq
```

検証:
```bash
jq --version
```

### オプションツール（テンプレート用）

- **prettier**: JavaScript/TypeScript フォーマット
- **black**: Python コードフォーマット
- **gofmt**: Go コードフォーマット

## レビューレポート

レビュー結果は以下の形式で出力されます：

1. **設定概要**: ファイルの場所、Hooks 数、スコープ
2. **セキュリティ評価**: 脆弱性チェック結果
3. **優先度別の発見事項**: Critical / High / Medium / Low
4. **具体的な修正例**: Before/After 形式のコード例
5. **推奨される次のアクション**: 優先順位付きのアクションアイテム

## テンプレート集

`assets/hooks-templates/` に以下のテンプレートを用意：

- **pre-write-format.json**: 書き込み前フォーマット
- **pre-commit-validation.json**: コミット前検証
- **session-logging.json**: セッションログ
- **secret-protection.json**: シークレット保護

## 注意事項

1. **対象の明確化**: どのファイルをレビュー/作成するか明確に指定してください
2. **セキュリティ優先**: 任意のシェルコマンドを実行する責任を理解してください
3. **テスト**: `claude --debug` でデバッグモードでテストしてください
4. **バージョン管理**: プロジェクト固有の hooks は `.claude/settings.json` に配置
5. **個人設定**: 個人/シークレットの設定は `.claude/settings.local.json` に配置

## 関連リンク

- [SKILL.md](./SKILL.md) - 実行フローと詳細な機能説明
- [references/hooks-guide.md](./references/hooks-guide.md) - 包括的な hooks ドキュメント
- [references/review-checklist.md](./references/review-checklist.md) - 評価チェックリスト
- [references/review-report-template.md](./references/review-report-template.md) - レビューレポートテンプレート
- [assets/hooks-templates/](./assets/hooks-templates/) - すぐに使えるテンプレート集

---

このスキルにより、Claude Code hooks の品質を客観的に評価し、安全で効率的なワークフロー自動化を実現できます。
