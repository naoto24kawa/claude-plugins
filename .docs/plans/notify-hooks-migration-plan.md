# notify プラグイン hooks.json 移行 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** notify プラグインのフック登録を hooks.json 自動化に移行し、セットアップスキルを軽量化する

**Architecture:** hooks.json で Stop + Notification フックを自動登録。notify.sh はサーバー未稼働時にサイレント終了するよう改修。セットアップスキルは LAN 設定 + テスト通知のみに削減。

**Tech Stack:** bash (notify.sh), JSON (hooks.json, marketplace.json), Markdown (SKILL.md, CLAUDE.md, README.md)

**Spec:** `.docs/plans/notify-hooks-migration-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `plugins/notify/hooks/hooks.json` | Stop + Notification フックの自動登録定義 |
| Modify | `plugins/notify/skills/notify-setup/scripts/notify.sh` | 通知送信失敗時のサイレント終了 |
| Modify | `plugins/notify/skills/notify-setup/SKILL.md` | LAN 設定 + サーバー確認 + テスト通知 + マイグレーション案内 |
| Delete | `plugins/notify/skills/notify-setup/examples/lan-access-settings.json` | hooks.json 化で不要 |
| Delete | `plugins/notify/skills/notify-setup/examples/per-project-settings.json` | hooks.json 化で不要 |
| Modify | `.claude-plugin/marketplace.json` | version 2.0.0, description 更新 |
| Modify | `CLAUDE.md` | プラグイン構成表 + ディレクトリ構造 |
| Modify | `README.md` | notify セクション更新 |

---

## Chunk 1: hooks.json 作成 + notify.sh 改修

### Task 1: hooks.json 作成

**Files:**
- Create: `plugins/notify/hooks/hooks.json`

- [ ] **Step 1: hooks ディレクトリ作成**

Run: `mkdir -p plugins/notify/hooks`

- [ ] **Step 2: hooks.json を作成**

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

- [ ] **Step 3: JSON 構文検証**

Run: `python3 -m json.tool plugins/notify/hooks/hooks.json > /dev/null && echo "VALID" || echo "INVALID"`
Expected: `VALID`

- [ ] **Step 4: Commit**

```bash
git add plugins/notify/hooks/hooks.json
git commit -m "feat(notify): add hooks.json for automatic Stop + Notification hook registration"
```

### Task 2: notify.sh エラーハンドリング改修

**Files:**
- Modify: `plugins/notify/skills/notify-setup/scripts/notify.sh:61-64`

- [ ] **Step 1: send_notification 関数のエラー処理を変更**

`plugins/notify/skills/notify-setup/scripts/notify.sh` の 61-64 行目を変更:

Before:
```bash
  if [ "$http_code" != "201" ]; then
    log "ERROR: notification failed (HTTP ${http_code})"
    echo "Failed to send notification (HTTP ${http_code})" >&2
    exit 1
  fi
```

After:
```bash
  if [ "$http_code" != "201" ]; then
    log "ERROR: notification failed (HTTP ${http_code})"
    exit 0
  fi
```

変更点:
- `echo ... >&2` を削除(stderr 出力はフック実行時にノイズになる)
- `exit 1` を `exit 0` に変更(フックとしては正常終了扱い)
- ログファイルにはエラーを記録(デバッグ用)

- [ ] **Step 2: 動作確認 (サーバー未稼働時にサイレント終了すること)**

Run:
```bash
echo '{"hook_event_name":"Stop","last_assistant_message":"test"}' | \
  CLAUDE_PROJECT_DIR=/tmp/test \
  NOTIFY_HOST=127.0.0.1 NOTIFY_PORT=19999 \
  plugins/notify/skills/notify-setup/scripts/notify.sh; echo "EXIT_CODE=$?"
```
Expected: `EXIT_CODE=0` (サーバー未稼働でもエラー終了しない)

- [ ] **Step 3: Commit**

```bash
git add plugins/notify/skills/notify-setup/scripts/notify.sh
git commit -m "fix(notify): silent exit on notification failure for hooks.json compatibility"
```

---

## Chunk 2: SKILL.md 軽量化 + examples 削除

### Task 3: examples ディレクトリ削除

**Files:**
- Delete: `plugins/notify/skills/notify-setup/examples/lan-access-settings.json`
- Delete: `plugins/notify/skills/notify-setup/examples/per-project-settings.json`

- [ ] **Step 1: examples ファイル削除**

```bash
rm plugins/notify/skills/notify-setup/examples/lan-access-settings.json
rm plugins/notify/skills/notify-setup/examples/per-project-settings.json
rmdir plugins/notify/skills/notify-setup/examples
```

- [ ] **Step 2: Commit**

```bash
git add -A plugins/notify/skills/notify-setup/examples/
git commit -m "refactor(notify): remove settings.json examples (replaced by hooks.json)"
```

### Task 4: SKILL.md 軽量化

**Files:**
- Modify: `plugins/notify/skills/notify-setup/SKILL.md`

- [ ] **Step 1: SKILL.md を書き換え**

新しい SKILL.md の全内容:

```markdown
---
name: notify-setup
description: This skill should be used when the user asks to "test notifications", "configure LAN notifications", "change NOTIFY_HOST", "check notification server", "通知テスト", "LAN通知設定", "通知サーバー確認", "NOTIFY_HOST変更", "通知の疎通確認", "migrate notify hooks", "旧フック設定を削除", or needs to verify, configure LAN access, or migrate legacy hook settings for the notify plugin.
---

# Notification Setup Skill

Test notifications, configure LAN access, and migrate legacy hook settings.

> **Note:** Stop + Notification hooks are automatically registered via `hooks/hooks.json` when this plugin is installed. This skill is for additional configuration and troubleshooting only.

## How notify.sh Works

`notify.sh` is a hook-dedicated script. It reads stdin JSON from Claude Code hook events, extracts the relevant message, and sends a notification to the server. No arguments are needed.

Supported events:
- **Stop** - extracts `last_assistant_message` (task completion)
- **Notification** - extracts `message` and `title` (input prompts)

## Execution Steps

### Step 1: Server Health Check

```bash
curl -sf http://<HOST>:23000/api/health
```

- Default HOST is `localhost`.
- If the server is not running, prompt the user to start it or provide the host/port.

### Step 2: Send Test Notifications

Resolve the notify.sh path from this skill's base directory:

```
<SKILL_BASE_DIR>/scripts/notify.sh
```

**Stop event:**
```bash
echo '{"hook_event_name":"Stop","last_assistant_message":"Setup test - notification working"}' | \
  CLAUDE_PROJECT_DIR="$PWD" <NOTIFY_SH_PATH>
```

**Notification event:**
```bash
echo '{"hook_event_name":"Notification","message":"Permission needed","title":"Tool approval","notification_type":"permission_prompt"}' | \
  CLAUDE_PROJECT_DIR="$PWD" <NOTIFY_SH_PATH>
```

Confirm the notifications appear on the dashboard at `http://<HOST>:23000`.

### Step 3: LAN Configuration (Optional)

For notifications across machines, the user needs to override `NOTIFY_HOST` in the hook command. Guide them to edit `.claude/settings.local.json` of the **target project** to override the plugin hook:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "NOTIFY_HOST=<IP> <NOTIFY_SH_PATH>"
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
            "command": "NOTIFY_HOST=<IP> <NOTIFY_SH_PATH>"
          }
        ]
      }
    ]
  }
}
```

Replace `<IP>` with the server's LAN IP and `<NOTIFY_SH_PATH>` with the absolute path to notify.sh.

### notify.sh Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NOTIFY_HOST` | localhost | Server hostname or IP |
| `NOTIFY_PORT` | 23000 | Server port |
| `NOTIFY_LOG` | /tmp/notify-hook.log | Log file path |

### Step 4: Migrate Legacy Hook Settings (If Needed)

If the user previously ran `notify-setup` (v1.x), they may have notify hooks in their project's `.claude/settings.json` or `.claude/settings.local.json`. These will cause **duplicate notifications** alongside the new hooks.json.

**Detection:** Check if the target project's settings files contain `notify.sh` in hook commands:

```bash
grep -r "notify.sh" <TARGET_PROJECT>/.claude/settings*.json 2>/dev/null
```

If found, guide the user to remove the `notify.sh` entries from the `hooks` object in those files. The hooks.json in this plugin now handles registration automatically.

## Additional Resources

- **`references/api-reference.md`** - API endpoints and request/response formats
- **`references/hook-events.md`** - Per-event stdin JSON fields and integration patterns
- **`references/ai-summarization.md`** - AI message summarization setup
```

- [ ] **Step 2: 行数確認 (500行以下であること)**

Run: `wc -l plugins/notify/skills/notify-setup/SKILL.md`
Expected: 100行前後 (500行制限以内)

- [ ] **Step 3: Commit**

```bash
git add plugins/notify/skills/notify-setup/SKILL.md
git commit -m "refactor(notify): slim down SKILL.md to LAN config, test, and migration only"
```

---

## Chunk 3: 整合性更新

### Task 5: marketplace.json 更新

**Files:**
- Modify: `.claude-plugin/marketplace.json:34-43`

- [ ] **Step 1: notify エントリの version と description を更新**

version: `"1.2.0"` -> `"2.0.0"`

description: `"Notification setup skill for simple-notify-tools. Bundles notify.sh and configures Claude Code Stop/Notification hooks with project or project-local config level selection. Supports task completion and input prompt notifications with AI summarization."` -> `"Notification plugin for simple-notify-tools with automatic hook registration. Sends Stop (task completion) and Notification (input prompt) events via bundled notify.sh. Includes setup skill for LAN configuration, server health check, and test notifications. Supports AI summarization."`

- [ ] **Step 2: JSON 構文検証**

Run: `python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo "VALID" || echo "INVALID"`
Expected: `VALID`

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "chore(notify): bump version to 2.0.0 and update description"
```

### Task 6: CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md:15,30`

- [ ] **Step 1: プラグイン構成表の notify 行を更新**

Before: `| notify | 1.2.0 | skills:1 | productivity |`
After: `| notify | 2.0.0 | skills:1, hooks:1 | productivity |`

- [ ] **Step 2: ディレクトリ構造の notify 行を更新**

Before: `    ├── notify/                 # skills/notify-setup/`
After: `    ├── notify/                 # skills/notify-setup/, hooks/hooks.json`

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for notify v2.0.0 with hooks"
```

### Task 7: README.md 更新

**Files:**
- Modify: `README.md:56-61`

- [ ] **Step 1: notify セクションを更新**

Before:
```markdown
### notify (v1.2.0)

タスク完了・入力待ち通知 (simple-notify-tools連携)。Stop/Notification Hookを設定する。

**スキル (1つ):**
- `/skill notify:notify-setup` - Hook設定 (プロジェクト or プロジェクトローカル)
```

After:
```markdown
### notify (v2.0.0)

タスク完了・入力待ち通知 (simple-notify-tools連携)。インストールするだけで Stop/Notification Hook が自動有効化される。

**Hooks (1つ):** Stop + Notification イベントで notify.sh を自動実行

**スキル (1つ):**
- `/skill notify:notify-setup` - 通知テスト、LAN設定、旧設定マイグレーション
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: update README.md for notify v2.0.0 with automatic hooks"
```

### Task 8: 最終整合性チェック

- [ ] **Step 1: 全ファイルの整合性を確認**

以下を手動確認:
- `hooks/hooks.json` が存在し、有効な JSON であること
- `SKILL.md` の description が 1024 文字以内であること
- `marketplace.json` の notify version が `2.0.0` であること
- `CLAUDE.md` の構成表と `marketplace.json` が一致すること
- `README.md` の notify バージョンが `v2.0.0` であること
- `examples/` ディレクトリが削除されていること

Run:
```bash
echo "=== hooks.json ===" && python3 -m json.tool plugins/notify/hooks/hooks.json > /dev/null && echo "VALID JSON"
echo "=== SKILL.md lines ===" && wc -l plugins/notify/skills/notify-setup/SKILL.md
echo "=== marketplace version ===" && python3 -c "import json; d=json.load(open('.claude-plugin/marketplace.json')); print([p['version'] for p in d['plugins'] if p['name']=='notify'])"
echo "=== examples deleted ===" && test -d plugins/notify/skills/notify-setup/examples && echo "EXISTS (ERROR)" || echo "DELETED (OK)"
```

Expected:
```
=== hooks.json ===
VALID JSON
=== SKILL.md lines ===
~100 lines
=== marketplace version ===
['2.0.0']
=== examples deleted ===
DELETED (OK)
```
