---
name: notify-setup
description: This skill should be used when the user asks to "test notifications", "configure LAN notifications", "change NOTIFY_HOST", "check notification server", "通知テスト", "LAN通知設定", "通知サーバー確認", "NOTIFY_HOST変更", "通知の疎通確認", "migrate notify hooks", "旧フック設定を削除", or needs to verify, configure LAN access, or migrate legacy hook settings for the notify plugin.
allowed-tools: ["Bash", "Read", "Grep", "Glob"]
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

Verify by checking the log file:

```bash
tail -5 /tmp/notify-hook.log
```

`OK` indicates success. `ERROR` indicates failure (check server status).

Also confirm the notifications appear on the dashboard at `http://<HOST>:23000`.

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
grep -l "notify.sh" <TARGET_PROJECT>/.claude/settings.json <TARGET_PROJECT>/.claude/settings.local.json 2>/dev/null
```

If found, guide the user to remove the `notify.sh` entries from the `hooks` object in those files. The hooks.json in this plugin now handles registration automatically.

## Additional Resources

- **`references/api-reference.md`** - API endpoints and request/response formats
- **`references/hook-events.md`** - Per-event stdin JSON fields and integration patterns
- **`references/ai-summarization.md`** - AI message summarization setup
