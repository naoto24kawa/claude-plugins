# Hooks Templates

This directory contains ready-to-use templates for common Claude Code hooks scenarios.

## Available Templates

### 1. Pre-Write Formatting (`pre-write-format.json`)

Validates file formatting before writes using language-specific formatters.

**Features:**
- JavaScript/TypeScript: prettier
- Python: black
- Go: gofmt

**Usage:**
```bash
# Copy template to your project
cp pre-write-format.json .claude/settings.json

# Copy the accompanying script
mkdir -p .claude/hooks
cp format-check.sh .claude/hooks/
chmod +x .claude/hooks/format-check.sh
```

### 2. Pre-Commit Validation (`pre-commit-validation.json`)

Prevents dangerous git operations that could cause data loss.

**Blocks:**
- Force pushes
- Hard resets
- Destructive branch deletions
- Interactive rebases

**Usage:**
```bash
# Copy template to your project
cp pre-commit-validation.json .claude/settings.json

# Copy the accompanying script
mkdir -p .claude/hooks
cp git-safety-check.sh .claude/hooks/
chmod +x .claude/hooks/git-safety-check.sh
```

### 3. Session Logging (`session-logging.json`)

Logs session start and end events for analytics.

**Logs to:** `~/.claude/logs/sessions.jsonl`

**Usage:**
```bash
# Copy template to global settings
cp session-logging.json ~/.claude/settings.json

# Copy the accompanying scripts
mkdir -p .claude/hooks
cp log-session-start.sh .claude/hooks/
cp log-session-end.sh .claude/hooks/
chmod +x .claude/hooks/log-session-*.sh
```

### 4. Secret Protection (`secret-protection.json`)

Prevents Claude Code from writing to files that commonly contain secrets.

**Protects:**
- `.env` files
- Credential files
- Private keys
- Service account files

**Usage:**
```bash
# Copy template to your project
cp secret-protection.json .claude/settings.json

# Copy the accompanying script
mkdir -p .claude/hooks
cp prevent-secret-writes.sh .claude/hooks/
chmod +x .claude/hooks/prevent-secret-writes.sh
```

## Customization Guide

All templates use `$CLAUDE_PROJECT_DIR` to reference scripts, making them portable across projects.

### Combining Multiple Hooks

You can combine multiple hook templates by merging their JSON:

```json
{
  "hooks": {
    "PreToolUse": {
      "Write|Edit": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/format-check.sh",
          "timeout": 5000
        },
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/prevent-secret-writes.sh",
          "timeout": 3000
        }
      ],
      "Bash": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/git-safety-check.sh",
          "timeout": 3000
        }
      ]
    },
    "SessionStart": {
      "*": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/log-session-start.sh",
          "timeout": 2000
        }
      ]
    },
    "SessionEnd": {
      "*": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/log-session-end.sh",
          "timeout": 2000
        }
      ]
    }
  }
}
```

### Adjusting Timeouts

Default timeouts are conservative. Adjust based on your needs:

- **Fast checks (< 1s):** 1000-3000ms
- **Format checks (1-3s):** 3000-5000ms
- **Security scans (3-10s):** 10000-30000ms

### Making Scripts Executable

Always ensure hook scripts have execute permissions:

```bash
chmod +x .claude/hooks/*.sh
```

## Testing Hooks

Before deploying hooks to production:

1. **Test in isolation:**
   ```bash
   echo '{"session_id":"test","tool_input":{"file_path":"test.js"}}' | .claude/hooks/format-check.sh
   ```

2. **Use debug mode:**
   ```bash
   claude --debug
   ```

3. **Check exit codes:**
   - `0` = Approve
   - `2` = Block
   - Other = Non-blocking error

4. **Verify output:**
   - stdout should have user-friendly messages
   - stderr should explain blocking reasons

## Security Notes

All templates follow these security best practices:

- ✅ Quote all shell variables
- ✅ Use absolute paths or `$CLAUDE_PROJECT_DIR`
- ✅ Validate JSON input
- ✅ Set appropriate timeouts
- ✅ Handle errors gracefully
- ✅ Exit with correct codes

Review the scripts before use and customize for your security requirements.
