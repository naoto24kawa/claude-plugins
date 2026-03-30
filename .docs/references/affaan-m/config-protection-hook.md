# Pattern: Config Protection Hook

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計 / エージェント制御
- **取り込み優先度**: 高

## 概要

Linter / Formatter の設定ファイルへの変更をブロックし、「設定を緩めるのではなくコードを修正しろ」とエージェントを誘導する。

## 保護対象ファイル (30+)

```
.eslintrc, .eslintrc.*, eslint.config.js, eslint.config.mjs
.prettierrc, .prettierrc.*, prettier.config.js
biome.json, biome.jsonc
ruff.toml, .ruff.toml
.shellcheckrc
.stylelintrc, stylelint.config.*
.markdownlint.json, .markdownlint-cli2.*
```

## 動作

- `PreToolUse` (matcher: `Write|Edit|MultiEdit`) で発火
- ファイルパスが保護リストに一致 → exit code 2 でブロック
- メッセージ: `"BLOCKED: Modifying [filename] is not allowed. Fix the source code to satisfy linter/formatter rules instead of weakening the config."`

## 設計の良さ

- エージェントが「テスト通すために lint ルール緩める」という安易な回避策を取るのを防ぐ
- `pyproject.toml` は除外 (プロジェクトメタデータも含むため)
- ブロック時のメッセージがエージェントへの行動指示を含む

## 適用先

plugin-dev の hooks.json に追加する候補。特にエージェントが自律的に動くシーンで有効。
