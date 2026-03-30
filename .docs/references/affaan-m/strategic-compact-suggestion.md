# Pattern: 戦略的コンパクション提案

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計 / コンテキスト管理
- **取り込み優先度**: 低

## 概要

ツールコール回数をカウントし、閾値到達時に手動コンパクションを提案する。

## 仕組み

- `PreToolUse` (matcher: `Edit|Write`) で発火
- セッション ID 別にテンポラリファイルでカウントを管理
- デフォルト閾値: 50回、以後 25回ごとにリマインド
- 閾値は `COMPACT_THRESHOLD` 環境変数で設定可能 (1-10,000)

## 設計の良さ

- 95% 自動コンパクションに任せると、作業の途中で文脈が失われるリスクがある
- 論理的な区切りでの手動コンパクションを促す
- 「提案のみ」(exit 0) でブロックはしない

## 自動 vs 手動コンパクションの知見

> "Strategic manual compaction preserves context through logical task phases, whereas automatic compaction might interrupt mid-workflow."

## 適用先

notify プラグインの Notification hook として取り込める可能性あり。
