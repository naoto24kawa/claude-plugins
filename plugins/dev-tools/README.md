# dev-tools

開発プロセス・並行レビュー・サイト調査・動作検証を一括で提供するClaude Codeプラグイン。

## 概要

プロジェクトに対して以下を提供する:

- **並行エキスパートレビュー**: 5名の専門レビュアーを並行ディスパッチし、指摘0件になるまで繰り返す
- **Webサイト定期調査**: サイクル管理付きのWebサイト探索・変更検知
- **動作検証の資料化**: 検証手順・結果・エビデンスを再現可能な形で記録

## インストール

```bash
/plugin install dev-tools@naoto24kawa-claude-plugins
```

## スキル一覧

| スキル | 発動キーワード例 | 用途 |
|--------|----------------|------|
| `parallel-review-cycle` | 「5人の専門家にレビューしてもらおう」「指摘が0になるまでレビュー」 | 5ロール並行レビューサイクルを自律実行 |

## コマンド一覧

| コマンド | 用途 |
|---------|------|
| `/site-explorer` | Webサイトの定期サイクル調査（変更検知・Issue管理付き） |

## エージェント一覧

### サイト調査・動作検証エージェント

| エージェント | 用途 |
|------------|------|
| site-explorer | Phase 0-5 サイクルでWebサイトを定期調査 |
| verification-documenter | 動作検証を実行し、手順・結果・エビデンスを再現可能な資料として `.docs/reviews/` に残す |

## ディレクトリ構成

```
dev-tools/
├── README.md
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   └── site-explorer.md        # /site-explorer コマンド定義
├── agents/
│   ├── site-explorer.md
│   └── verification-documenter.md
├── hooks/
│   └── guardrails/
│       ├── PATTERNS.md
│       ├── README.md
│       ├── audit-log.py
│       ├── kill-switch.sh
│       ├── path-allowlist.py
│       ├── rate-fuse.py
│       └── settings.example.json
├── references/
│   └── config-template.md      # site-explorer 設定テンプレート
└── skills/
    └── parallel-review-cycle/
        ├── SKILL.md
        └── references/
            ├── agent-output-principles.md
            ├── altitude-checker.md
            ├── ambiguity-hunter.md
            ├── fp-registry-format.md
            └── specialist-roles.md
```

## 推奨ワークフロー

### コードレビュー

```
「5人の専門家にレビューしてもらおう」→ parallel-review-cycle → 全員LGTM まで自律実行
```

### Webサイト調査

```
/site-explorer → Phase 0-5 サイクル → 変更検知・GitHub Issue 管理・レポート生成
```
