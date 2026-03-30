# Pattern: Quality Gate (Post-Edit 品質チェック)

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計 / コード品質
- **取り込み優先度**: 中

## 概要

ファイル編集後に言語別のフォーマッタ・リンタを自動実行する。

## 対象と実行ツール

| 拡張子 | ツール |
|--------|--------|
| `.ts`, `.tsx`, `.js`, `.jsx` | Biome or Prettier |
| `.json`, `.md` | Prettier |
| `.go` | gofmt |
| `.py` | Ruff |

## 動作モード

- `ECC_QUALITY_GATE_FIX=1`: 自動修正
- `ECC_QUALITY_GATE_STRICT=1`: 失敗時にエラー (ブロック)
- デフォルト: チェックのみ、警告出力

## 設計の良さ

- Biome 設定済みの場合 `post-edit-format.js` と重複しないよう JS/TS をスキップ
- 言語ごとにツールを自動検出 (存在しなければスキップ)
- `run()` エクスポートで in-process 実行にも対応 (spawn より ~50-100ms 高速)

## 適用先

plugin-dev プラグインの hook に追加する候補。
