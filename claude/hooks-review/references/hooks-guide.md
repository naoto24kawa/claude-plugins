# Claude Code Hooks - Comprehensive Guide

## Overview

Hooks are shell commands that execute automatically in response to specific events during Claude Code's operation. They enable powerful workflow automation for validation, formatting, security checks, and custom integrations.

## Configuration Files

Hooks are configured in JSON format across three potential locations, merged in this priority order:

1. **`~/.claude/settings.json`** - User-wide global hooks (affects all projects)
2. **`.claude/settings.json`** - Project-specific hooks (version controlled, shared with team)
3. **`.claude/settings.local.json`** - Local overrides (git-ignored, personal customizations)

### Basic Structure

```json
{
  "hooks": {
    "<EventName>": {
      "<ToolMatcher>": [
        {
          "type": "command",
          "command": "script.sh",
          "timeout": 60000
        }
      ]
    }
  }
}
```

**Hierarchy:** Event → Matcher → Hook Array

### Matcher Patterns

Matchers specify which tools trigger the hook:

- **Exact match**: `"Write"` - Only the Write tool
- **Regex pattern**: `"Write|Edit"` - Write OR Edit tools
- **Regex pattern**: `"Notebook.*"` - All Notebook tools
- **Wildcard**: `"*"` - All tools
- **MCP tools**: `"mcp__server__tool"` - Specific MCP tool
- **MCP pattern**: `"mcp__memory__.*"` - All tools from memory server

## Hook Events

### PreToolUse

**Trigger:** Before a tool executes

**Common Use Cases:**
- Input validation before file writes
- Code formatting before edits
- Security checks before bash commands
- Cost estimation before expensive operations

**Input Fields:**
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "hook_event_name": "PreToolUse",
  "permission_mode": "string",
  "tool_name": "Write|Edit|Bash|...",
  "tool_input": { /* tool-specific parameters */ }
}
```

**Exit Codes:**
- `0` - Approve (stdout shown to user)
- `2` - Block (stderr sent to Claude as feedback)
- Other - Non-blocking error (stderr shown to user)

### PostToolUse

**Trigger:** Immediately after a tool executes

**Common Use Cases:**
- Verification of file writes
- Notifications on significant changes
- Cleanup operations
- Logging and analytics

**Input Fields:**
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "hook_event_name": "PostToolUse",
  "permission_mode": "string",
  "tool_name": "Write|Edit|Bash|...",
  "tool_input": { /* tool-specific parameters */ },
  "tool_output": { /* tool result */ }
}
```

### UserPromptSubmit

**Trigger:** When user submits a prompt

**Common Use Cases:**
- Input logging
- Custom preprocessing
- Quota checks
- Prompt validation

**Input Fields:**
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "hook_event_name": "UserPromptSubmit",
  "permission_mode": "string",
  "user_prompt": "string"
}
```

### Stop

**Trigger:** Main agent stops responding

**Common Use Cases:**
- Analytics tracking
- Cleanup operations
- Session summaries
- Cost reporting

**Supported Decision Types:** `approve`, `block`, `deny`

**JSON Output for Control:**
```json
{
  "decision": "approve|block|deny",
  "reason": "Explanation for the decision",
  "continue": false,
  "systemMessage": "Message to display to user"
}
```

### SubagentStop

**Trigger:** When a subagent completes

**Common Use Cases:**
- Task completion tracking
- Subagent result logging
- Performance monitoring
- Error aggregation

**Supported Decision Types:** `approve`, `block`, `deny`

### SessionStart

**Trigger:** When a Claude Code session begins

**Common Use Cases:**
- Environment initialization
- Dependency checks
- Welcome messages
- Configuration validation

**Input Fields:**
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "hook_event_name": "SessionStart",
  "permission_mode": "string"
}
```

### SessionEnd

**Trigger:** When a Claude Code session terminates

**Common Use Cases:**
- Cleanup operations
- Final reporting
- Cost summaries
- State persistence

### Notification

**Trigger:** When a notification is sent

**Common Use Cases:**
- Custom notification routing
- Notification filtering
- External integrations (Slack, email)
- Notification logging

**Input Fields:**
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "hook_event_name": "Notification",
  "permission_mode": "string",
  "notification_type": "string",
  "notification_content": "string"
}
```

### PreCompact

**Trigger:** Before context window compaction

**Common Use Cases:**
- State preservation
- Context analysis
- Compaction logging
- Critical information extraction

## Hook Types

### Command Hooks

Execute shell commands with environment variable access.

```json
{
  "type": "command",
  "command": "/absolute/path/to/script.sh",
  "timeout": 60000
}
```

**Environment Variables:**
- `$CLAUDE_PROJECT_DIR` - Project root directory (use for relative path resolution)
- All standard shell environment variables

**Best Practices:**
- Use absolute paths for scripts: `/usr/local/bin/script.sh`
- Or use `$CLAUDE_PROJECT_DIR`: `$CLAUDE_PROJECT_DIR/.claude/hooks/script.sh`
- Always quote variables: `"$CLAUDE_PROJECT_DIR/file.txt"`
- Set appropriate timeouts (default: 60000ms = 60s)
- Validate JSON input in scripts

### Prompt Hooks

Delegate decision-making to an LLM (Haiku model).

```json
{
  "type": "prompt",
  "prompt": "Analyze this tool use and determine if it should be blocked...",
  "timeout": 30000
}
```

**Currently Supported Events:** `Stop`, `SubagentStop` only

**LLM Response Format:**
```json
{
  "decision": "approve|block|deny",
  "reason": "Why this decision was made"
}
```

## Input/Output Handling

### Reading Input (stdin)

Hooks receive JSON input via stdin. Always validate:

```bash
#!/bin/bash
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')
```

```python
#!/usr/bin/env python3
import sys
import json

input_data = json.load(sys.stdin)
tool_name = input_data.get('tool_name')
```

### Exit Codes

Control hook behavior through exit codes:

- **`0` (Success)** - Approve the action, stdout displayed to user
- **`2` (Blocking Error)** - Block the action, stderr sent to Claude as feedback
- **Other** - Non-blocking error, stderr shown to user, action proceeds

### JSON Output (Advanced)

For fine-grained control (Stop/SubagentStop events):

```json
{
  "decision": "approve|block|deny",
  "reason": "Human-readable explanation",
  "continue": false,
  "systemMessage": "Message shown to user"
}
```

## Plugin Hooks Integration

Plugins can define hooks in `hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": {
      "Write": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh"
        }
      ]
    }
  }
}
```

**Available Variables:**
- `${CLAUDE_PLUGIN_ROOT}` - Plugin directory
- `${CLAUDE_PROJECT_DIR}` - Project root

Plugin hooks are automatically merged when the plugin is enabled.

## Execution Model

### Parallel Execution

Multiple hooks for the same event/matcher run in **parallel**, not sequentially.

**Implications:**
- Cannot rely on execution order
- Race conditions possible for shared resources
- Use file locking if hooks modify same files
- Independent hooks work best

### Timeout Handling

Each hook can specify a timeout in milliseconds:

```json
{
  "type": "command",
  "command": "slow-script.sh",
  "timeout": 120000
}
```

**Default:** 60000ms (60 seconds)
**Maximum:** 600000ms (10 minutes)

If a hook exceeds its timeout, it's terminated and treated as a non-blocking error.

## Security Best Practices

### 1. Input Validation

Always validate JSON structure and field types:

```python
import sys
import json

try:
    data = json.load(sys.stdin)
    if 'tool_name' not in data:
        sys.exit(1)
except json.JSONDecodeError:
    sys.exit(1)
```

### 2. Absolute Paths

Never rely on PATH environment variable:

```json
// ❌ Bad - PATH-dependent
{
  "command": "prettier --check"
}

// ✅ Good - Absolute path
{
  "command": "/usr/local/bin/prettier --check"
}

// ✅ Good - Project-relative
{
  "command": "$CLAUDE_PROJECT_DIR/node_modules/.bin/prettier --check"
}
```

### 3. Quote Shell Variables

Prevent command injection:

```bash
# ❌ Bad - Unquoted variable
file=$CLAUDE_PROJECT_DIR/file.txt

# ✅ Good - Quoted variable
file="$CLAUDE_PROJECT_DIR/file.txt"
```

### 4. Protect Secrets

Never commit sensitive data:

- Avoid `.env` files in hooks configurations
- Never hardcode API keys or credentials
- Use `.claude/settings.local.json` for local secrets (git-ignored)
- Reference secrets from secure environment variables

### 5. Principle of Least Privilege

Run hooks with minimum necessary permissions:

- Don't use `sudo` in hooks unless absolutely required
- Limit file system access
- Avoid network calls to untrusted endpoints
- Validate all external inputs

### 6. Code Review for Hooks

Treat hooks like production code:

- Review all hook scripts before deployment
- Test thoroughly in isolated environment
- Document expected behavior
- Version control hook configurations (except `.local.json`)

## Debugging Hooks

### Enable Debug Mode

Run Claude Code with debug logging:

```bash
claude --debug
```

This shows detailed hook execution information including:
- When hooks are triggered
- Hook input/output
- Exit codes
- Execution time
- Error messages

### Transcript Mode

Use transcript mode (Ctrl-R) to review:
- Full conversation history
- Hook execution progress
- Input/output details
- Timing information

### Common Issues

**Hook not triggering:**
- Verify event name is correct
- Check matcher pattern matches the tool
- Ensure hook configuration is valid JSON
- Confirm settings file is being loaded

**Hook blocking when it shouldn't:**
- Check exit code logic (2 = blocking)
- Verify stderr output
- Review conditional logic in script

**Hook timing out:**
- Increase timeout value
- Optimize script performance
- Check for infinite loops
- Use async operations where possible

**Permission denied:**
- Ensure script has execute permissions: `chmod +x script.sh`
- Verify absolute path is correct
- Check file ownership

## Advanced Patterns

### Conditional Blocking

Only block certain file types:

```bash
#!/bin/bash
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path')

if [[ "$file_path" == *.env ]]; then
  echo "Blocking write to .env file for security" >&2
  exit 2
fi

exit 0
```

### Tool-Specific Validation

Different validation for different tools:

```json
{
  "hooks": {
    "PreToolUse": {
      "Write": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-write.sh"
        }
      ],
      "Bash": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate-bash.sh"
        }
      ]
    }
  }
}
```

### Multi-Stage Validation

Combine multiple checks:

```bash
#!/bin/bash
set -e

# Stage 1: Syntax check
if ! syntax_check "$file"; then
  echo "Syntax error detected" >&2
  exit 2
fi

# Stage 2: Security scan
if ! security_scan "$file"; then
  echo "Security issue detected" >&2
  exit 2
fi

# Stage 3: Format check
if ! format_check "$file"; then
  echo "Format issues detected" >&2
  exit 2
fi

echo "All validations passed"
exit 0
```

### Session Analytics

Track session statistics:

```python
#!/usr/bin/env python3
import json
import sys
from pathlib import Path

data = json.load(sys.stdin)
session_id = data['session_id']

# Log session end
log_file = Path.home() / '.claude' / 'analytics.jsonl'
with open(log_file, 'a') as f:
    json.dump({
        'event': 'session_end',
        'session_id': session_id,
        'timestamp': data.get('timestamp')
    }, f)
    f.write('\n')

sys.exit(0)
```

## MCP Tool Hooks

Hooks work with MCP (Model Context Protocol) tools using naming convention:

**Pattern:** `mcp__<server-name>__<tool-name>`

**Examples:**
```json
{
  "hooks": {
    "PreToolUse": {
      "mcp__memory__create_entities": [
        {
          "type": "command",
          "command": "validate-memory-write.sh"
        }
      ],
      "mcp__filesystem__.*": [
        {
          "type": "command",
          "command": "validate-filesystem-access.sh"
        }
      ]
    }
  }
}
```

This enables security controls and validation for MCP server operations.

## Performance Considerations

### Optimize Hook Execution

Hooks add latency to operations. Optimize by:

1. **Keep scripts fast** - Aim for <100ms execution time
2. **Use compiled languages** - Prefer Go/Rust over interpreted scripts for heavy processing
3. **Cache results** - Store validation results to avoid recomputation
4. **Async where possible** - Use background jobs for non-critical operations
5. **Minimize dependencies** - Reduce startup overhead

### When NOT to Use Hooks

Avoid hooks for:

- Operations requiring human judgment
- Complex workflows better suited for slash commands or skills
- Frequent operations where latency is critical
- Tasks better handled by external CI/CD systems

## Examples

See `assets/hooks-templates/` for complete, working examples of common hook patterns.
