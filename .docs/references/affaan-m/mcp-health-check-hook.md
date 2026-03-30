# Pattern: MCP Health Check Hook

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計 / 可用性
- **取り込み優先度**: 低

## 概要

MCP サーバーの死活監視を Hook レベルで実装し、不健全なサーバーへのツールコールを事前ブロックする。

## 仕組み

2つのイベントで動作:

1. **PreToolUse** (`matcher: *`): MCP ツール実行前にサーバーの health probe を実行。失敗時は再接続を試み、それでも失敗ならブロック
2. **PostToolUseFailure** (`matcher: *`): ツール実行失敗時にエラーコード (401, 403, 429, 503, transport error) を検知し、サーバーを unhealthy マーク

## 状態管理

- 健全性状態をファイルにキャッシュ (会話コンテキスト外に永続化)
- Exponential backoff で再試行間隔を制御
- Fail-open モードあり (設定で切り替え可能)

## 設計の良さ

- コンテキストウィンドウを消費せずに MCP の健全性を追跡
- 「MCP が死んでるのにツールコールして失敗を繰り返す」ループを防止
- 状態永続化エラーが発生しても Hook 自体は止まらない (fail-safe)

## 適用先

複数 MCP を使うプロジェクトで有効。単一 MCP プラグインでは優先度低。
