# notify プラグイン hooks.json 移行設計

## 概要

notify プラグインのフック登録方式を、セットアップスキルによる手動設定から hooks.json による自動有効化に移行する。セットアップスキルは LAN 設定とテスト通知に特化した軽量版に改修する。

## 背景

- 現状: `notify-setup` スキルが対話的にユーザーの settings.json/settings.local.json にフック設定を書き込む
- 課題: プラグインインストール後にスキルを手動実行しないと通知が動かない
- 解決: hooks.json でインストール時に自動有効化し、セットアップの手間を削減

## 方針

**A案(採用): hooks.json に notify.sh を直接指定**

- `hooks/hooks.json` で Stop + Notification に notify.sh を command 型で登録
- `${CLAUDE_PLUGIN_ROOT}` でスクリプトパスを解決
- セットアップスキルは LAN 設定 + テスト通知のみに削減

## 変更一覧

### 新規作成

| ファイル | 内容 |
|---|---|
| `plugins/notify/hooks/hooks.json` | Stop + Notification フック定義 |

### 改修

| ファイル | 内容 |
|---|---|
| `plugins/notify/skills/notify-setup/SKILL.md` | 大幅削減。LAN 設定案内 + サーバー確認 + テスト通知のみ |
| `plugins/notify/skills/notify-setup/scripts/notify.sh` | サーバー未稼働時にサイレント終了するよう改修(exit 1 -> exit 0) |

### 削除

| ファイル | 理由 |
|---|---|
| `plugins/notify/skills/notify-setup/examples/lan-access-settings.json` | hooks.json 化により settings.json の例は不要 |
| `plugins/notify/skills/notify-setup/examples/per-project-settings.json` | 同上 |

### 変更なし

| ファイル | 理由 |
|---|---|
| `plugins/notify/skills/notify-setup/references/api-reference.md` | テスト通知で参照 |
| `plugins/notify/skills/notify-setup/references/hook-events.md` | フックイベントの理解に有用 |
| `plugins/notify/skills/notify-setup/references/ai-summarization.md` | サーバー機能の説明 |

### 整合性更新

| ファイル | 内容 |
|---|---|
| `.claude-plugin/marketplace.json` | version 1.2.0 -> 2.0.0、description 更新(下記参照) |
| `CLAUDE.md` | プラグイン構成表: version 2.0.0、hooks:1 追加。ディレクトリ構造: hooks/ 追加 |
| `README.md` | notify の説明更新 |

#### marketplace.json 新 description

```
"Notification plugin for simple-notify-tools with automatic hook registration. Sends Stop (task completion) and Notification (input prompt) events via bundled notify.sh. Includes setup skill for LAN configuration, server health check, and test notifications. Supports AI summarization."
```

## hooks.json 設計

```json
{
  "description": "Sends notifications on Stop and Notification hook events via notify.sh",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/skills/notify-setup/scripts/notify.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/skills/notify-setup/scripts/notify.sh"
          }
        ]
      }
    ]
  }
}
```

- matcher: `"*"`(全イベントにマッチ、plugin-dev の hooks.json と統一)
- type: command(スクリプト実行)
- `${CLAUDE_PLUGIN_ROOT}` はプラグインルートに展開される

## 軽量スキル設計

### 役割

1. サーバー稼働確認(health check)
2. テスト通知送信(Stop / Notification)
3. LAN 設定案内(`NOTIFY_HOST` の設定方法)

### 削除する機能

- 前提ツール確認(curl, jq)
- notify.sh パス解決
- フック種別の選択質問
- 設定レベルの選択質問
- settings.json へのフック書き込み

## notify.sh エラーハンドリング改修

hooks.json による自動実行ではサーバー未稼働が日常的に起こりうる。現行の notify.sh はサーバー接続失敗時に `exit 1` するが、フックが毎回エラー終了するのは不適切。

**改修方針**: 通知送信失敗時に `exit 1` ではなく `exit 0` に変更する。ログファイルにはエラーを記録するが、フック自体は正常終了として Claude Code に返す。

## マイグレーション(既存ユーザー向け)

旧 `notify-setup` スキルで settings.json / settings.local.json にフック設定を書き込んだユーザーは、hooks.json との二重実行が発生する。

**対応**:
- 軽量スキルに「既存フック設定の検出と削除案内」ステップを追加
- README のリリースノートセクションに手動削除手順を明記

## バージョニング

`1.2.0` -> `2.0.0`

セットアップスキルの役割が根本的に変わり、既存の利用フロー(スキル実行でフック登録)が不要になる破壊的変更のため、メジャーバージョンをバンプする。
