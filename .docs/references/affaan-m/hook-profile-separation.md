# Pattern: Hook プロファイル分離

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計
- **取り込み優先度**: 中

## 概要

Hook の強制レベルを `minimal` / `standard` / `strict` の3段階に分離し、環境変数で切り替える。

## 仕組み

`run-with-flags.js` が全 Hook のラッパーとして機能する:

```json
{
  "type": "command",
  "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/hooks/run-with-flags.js\" \"pre:bash:commit-quality\" \"scripts/hooks/pre-bash-commit-quality.js\" \"strict\""
}
```

- 第1引数: Hook ID (重複防止用の一意キー)
- 第2引数: 実行するスクリプトのパス
- 第3引数: 有効プロファイル (カンマ区切り、例: `"standard,strict"`)

ユーザーは環境変数 `ECC_HOOK_PROFILE` で現在のプロファイルを設定:
- `minimal`: 最小限 (セッション管理のみ)
- `standard`: 標準 (品質チェック含む)
- `strict`: 厳格 (フォーマット強制・型チェック含む)

## 設計の良さ

- チーム導入時に `minimal` → `standard` → `strict` と段階的に厳格化できる
- 個別 Hook を無効化せずプロファイル単位で制御できる
- CI では `strict`、ローカル開発では `standard` という使い分けが可能

## 適用先

notify や plugin-dev の hooks.json で同様のプロファイル分離を導入できる。
