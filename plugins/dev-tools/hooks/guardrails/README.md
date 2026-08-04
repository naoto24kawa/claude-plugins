# guardrails

Claude Code の PreToolUse / PostToolUse hook として使える汎用ガードレール群。
環境変数でパラメータ化されており、どのプロジェクトにも配線できる。

## ファイル一覧

| ファイル | hook タイプ | 役割 |
|---|---|---|
| `kill-switch.sh` | PreToolUse | STOP ファイルが存在すると全ツールを緊急停止 |
| `path-allowlist.py` | PreToolUse | 書込先を許可パスリストに制限（Edit/Write/MultiEdit） |
| `rate-fuse.py` | PreToolUse | ツール呼び出し回数を閾値でブロック |
| `audit-log.py` | PostToolUse | ツール実行を JSONL 形式で記録 |
| `settings.example.json` | — | Claude Code settings.json への配線例 |

## 配線方法

プロジェクトの `.claude/settings.json` またはグローバルの `~/.claude/settings.json` に追記する。
パスは `${CLAUDE_PLUGIN_ROOT}/hooks/guardrails/` を使う（プラグインの配置先が版で変わるため、絶対パスを直書きしない）。

`hooks.json` へは登録していない。kill-switch と rate-fuse はツール実行をブロックする挙動を持つため、
プラグインを入れただけで有効化されない形にしている。使うときに下記を明示的に配線する。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/guardrails/kill-switch.sh"
          },
          {
            "type": "command",
            "command": "GUARDRAILS_ALLOW_PATHS=/your/project/.docs python3 ${CLAUDE_PLUGIN_ROOT}/hooks/guardrails/path-allowlist.py"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "GUARDRAILS_AUDIT_LOG=${HOME}/.config/guardrails/audit.jsonl python3 ${CLAUDE_PLUGIN_ROOT}/hooks/guardrails/audit-log.py"
          }
        ]
      }
    ]
  }
}
```

## 各スクリプトの環境変数

### kill-switch.sh
| 変数 | デフォルト | 説明 |
|---|---|---|
| `GUARDRAILS_STOP_FILE` | `$HOME/.config/guardrails/STOP` | STOP ファイルのパス |

```bash
touch "$HOME/.config/guardrails/STOP"  # 停止
rm    "$HOME/.config/guardrails/STOP"  # 再開
```

### path-allowlist.py
| 変数 | デフォルト | 説明 |
|---|---|---|
| `GUARDRAILS_ALLOW_PATHS` | （未設定 = 全拒否） | 許可パスのコロン区切りリスト |

### rate-fuse.py
| 変数 | デフォルト | 説明 |
|---|---|---|
| `GUARDRAILS_FUSE_LIMIT` | `10` | 上限件数 |
| `GUARDRAILS_FUSE_COUNTER` | `/tmp/guardrails-fuse-count` | カウンタファイルのパス |
| `GUARDRAILS_FUSE_TOOL_PATTERN` | `""` (空 = 全ツール) | 監視対象の正規表現 |

### audit-log.py
| 変数 | デフォルト | 説明 |
|---|---|---|
| `GUARDRAILS_AUDIT_LOG` | `$HOME/.config/guardrails/audit.jsonl` | ログファイルのパス |
| `GUARDRAILS_AUDIT_TOOLS` | `""` (空 = 全ツール) | 記録対象ツール名のコロン区切り |

## スキル内で使うパターン

hook として配線せず、スキル定義（SKILL.md）内に規律として組み込む場合は
`../skill-patterns/guardrails.md` を参照すること。
