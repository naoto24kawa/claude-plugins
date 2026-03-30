# Pattern: コンテキストウィンドウ管理戦略

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: 運用知見
- **取り込み優先度**: 参考

## 概要

the-shortform-guide.md から抽出した、コンテキストウィンドウとコストに関する実践的知見。

## MCP ツール数の上限管理

> "Have 20-30 MCPs in config, but keep under 10 enabled / under 80 tools active."

- MCP を全有効化すると 200k コンテキストが実質 70k になる
- プロジェクト別に `disabledMcpServers` で未使用 MCP を無効化

## モデル使い分け

> "Sonnet をデフォルトにして、Opus は設計作業だけ使え。コスト 60% 削減。"

| 用途 | 推奨モデル |
|------|-----------|
| 日常的なコーディング | Sonnet |
| アーキテクチャ設計、複雑な計画 | Opus |
| 単純なリネーム、フォーマット | Haiku |

## コンパクションタイミング

> "95% 自動任せでなく、論理的な区切りで `/compact` を手動実行。"

- タスク完了後、次のタスク開始前が最適
- 自動コンパクションは作業中断リスクあり

## 適用先

README やユーザーガイドに「推奨設定」として記載可能。
