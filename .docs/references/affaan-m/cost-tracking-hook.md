# Pattern: コスト追跡 Hook

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計 / 可観測性
- **取り込み優先度**: 中

## 概要

セッション単位のトークン消費量とコストを JSONL ファイルに記録する。

## 仕組み

- `Stop` イベントで発火 (async, timeout: 10s)
- stdin から使用量 JSON を受け取り、モデル別の料金テーブルでコスト推定
- `~/.claude/metrics/costs.jsonl` に追記

## 料金テーブル (per 1M tokens)

| Model | Input | Output |
|-------|-------|--------|
| Haiku | $0.80 | $4.00 |
| Sonnet | $3.00 | $15.00 |
| Opus | $15.00 | $75.00 |

## 記録フォーマット

```jsonl
{"timestamp":"...","session_id":"...","model":"...","input_tokens":N,"output_tokens":N,"estimated_cost":N}
```

## 設計の良さ

- 非ブロッキング (async) でメインフローに影響しない
- JSONL 形式で後から集計・可視化しやすい
- stdin 1MB 制限でメモリ安全

## 適用先

observability プラグインの拡張として取り込める可能性あり。
