# Pattern: エージェント役割分離

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: エージェント設計
- **取り込み優先度**: 高

## 概要

30個のエージェントを4カテゴリに分離し、適切なスコープで委譲する。

## カテゴリ構造

```
agents/
├── ワークフロー系 (汎用)
│   ├── planner.md          # 実装計画策定
│   ├── architect.md        # アーキテクチャ設計
│   ├── tdd-guide.md        # TDD ワークフロー
│   ├── code-reviewer.md    # コードレビュー
│   └── security-reviewer.md # セキュリティ監査
│
├── 言語別レビューア (専門)
│   ├── typescript-reviewer.md
│   ├── python-reviewer.md
│   ├── go-reviewer.md
│   ├── java-reviewer.md
│   ├── kotlin-reviewer.md
│   ├── rust-reviewer.md
│   ├── cpp-reviewer.md
│   └── flutter-reviewer.md
│
├── 言語別ビルドリゾルバ (問題解決)
│   ├── build-error-resolver.md  # 汎用
│   ├── go-build-resolver.md
│   ├── java-build-resolver.md
│   ├── kotlin-build-resolver.md
│   ├── rust-build-resolver.md
│   ├── cpp-build-resolver.md
│   └── pytorch-build-resolver.md
│
└── ユーティリティ系
    ├── doc-updater.md       # ドキュメント同期
    ├── refactor-cleaner.md  # デッドコード除去
    ├── e2e-runner.md        # E2E テスト実行
    ├── loop-operator.md     # ループ自動化
    └── harness-optimizer.md # 設定最適化
```

## 設計の良さ

### 信頼度閾値による出力制御

code-reviewer は **信頼度 80% 閾値** を設定し、80% 以上の確信がある指摘のみ出力する。
これによりレビュー結果のノイズを大幅に削減している。

### 誤検知パターンの明示

security-reviewer は以下を「誤検知」として明示定義:

- `.env.example` 内のダミー値 (実際のシークレットではない)
- テストファイル内の認証情報 (テスト用と明記されている場合)
- 公開 API キー (意図的に公開されているもの)
- SHA256/MD5 がチェックサム用途で使用されている場合 (パスワードハッシュではない)

### 責務の分離

- 言語別レビューアとビルドリゾルバを分離し、「レビュー」と「修正」が混在しない
- ワークフロー系は汎用、言語別は専門知識に特化

### モデル適材適所

各エージェントに `model` フィールドで適切なモデルを指定:
- レビューア系 → `sonnet` (高速・低コスト)
- planner / architect → `opus` (高品質な推論が必要)

## 適用先

dev-process プラグインのエージェント構成の参考。特に信頼度閾値と誤検知パターンの明示は取り入れたい。
