---
name: hooks-review
description: Reviews and configures Claude Code hooks for workflow automation. Triggers when users mention "hooks setup", "review hooks configuration", "create hooks", "validate hooks", "hooks best practices", "troubleshoot hooks", "debug hooks errors", or "hooks security review". Analyzes PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, SessionStart, SessionEnd, Notification, and PreCompact event handlers for security vulnerabilities, performance issues, and best practices compliance.
---

# Hooks Reviewer

## Overview

This skill enables comprehensive review and configuration of Claude Code hooks - shell commands that execute in response to specific events during Claude Code's operation. Hooks provide powerful workflow automation capabilities for tasks like validation, formatting, security checks, and custom integrations.

## Core Capabilities

### 1. Hooks Configuration Review

Analyze existing hooks configurations in `~/.claude/settings.json`, `.claude/settings.json`, or `.claude/settings.local.json` to identify:

- Security vulnerabilities (command injection, unquoted variables, exposed secrets)
- Performance issues (missing timeouts, inefficient patterns)
- Correctness problems (improper exit codes, malformed JSON)
- Best practice violations
- Opportunities for optimization

**Review Process:**

1. Read the hooks configuration file(s)
   - **Validation:** File exists and contains valid JSON structure
2. Load `references/review-checklist.md` for comprehensive evaluation criteria
   - **Validation:** Checklist loaded successfully, all evaluation criteria available
3. Analyze each hook against security, performance, and correctness standards
   - **Validation:** All hooks analyzed, findings categorized by type
4. Provide specific, actionable recommendations with examples
   - **Validation:** Each recommendation includes concrete before/after code example
5. Prioritize findings by severity (Critical/High/Medium/Low)
   - **Validation:** All findings have assigned severity levels and impact assessment
6. Generate review report following `references/review-report-template.md`
   - **Validation:** Report includes all required sections and actionable recommendations

### 2. Hooks Creation and Setup

Guide users through creating new hooks configurations for common scenarios:

- Code formatting on write (PreToolUse for Write/Edit)
- Security scanning before commits (PreToolUse for Bash with git commands)
- Test execution validation (PostToolUse)
- Session logging and analytics (SessionStart/SessionEnd)
- Custom notification integrations (Notification)

**Setup Process:**

1. Understand the user's automation requirement
   - **Validation:** Clear understanding of trigger event and desired action
2. Identify the appropriate event type and matcher pattern
   - **Validation:** Event type is valid (PreToolUse, PostToolUse, etc.), matcher pattern is correct
3. Reference `assets/hooks-templates/` for similar examples
   - **Validation:** Appropriate template identified for the use case
4. Generate a secure, well-structured hooks configuration
   - **Validation:** Configuration follows security best practices, all required fields present
5. Explain the configuration and how to test it
   - **Validation:** User understands configuration purpose and testing approach
6. Provide troubleshooting guidance
   - **Validation:** Common issues and debugging steps documented

### 3. Hooks Validation and Testing

Verify that hooks configurations will work correctly:

- Validate JSON structure and required fields
  - **Error Handling:** Report specific syntax errors with line numbers, suggest using `jq` for validation
- Check for proper event/matcher combinations
  - **Error Handling:** If invalid event name, provide list of valid events from documentation
- Verify script paths exist and are executable
  - **Error Handling:** If path not found, check common locations and suggest absolute path resolution
- Ensure environment variables are properly quoted
  - **Error Handling:** Identify unquoted variables, show before/after examples with proper quoting
- Confirm timeout values are appropriate
  - **Error Handling:** Warn if timeout is too short (<1000ms) or too long (>600000ms), suggest typical ranges
- Test exit code handling logic
  - **Error Handling:** Verify scripts return correct codes (0/2/other), explain each code's meaning

**Common Validation Errors:**

**File Not Found:**
- Check standard locations: `~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`
- Ask user to specify exact file path
- If still not found, offer to create new configuration from template

**Invalid JSON:**
- Parse error location and provide line/column number
- Identify common issues: trailing commas, unquoted strings, missing brackets
- Suggest using `jq empty < file.json` to validate
- Offer to fix automatically if issues are simple

**Missing Required Fields:**
- List which fields are missing for each hook
- Provide template with required structure
- Explain purpose of each required field

**Script Execution Errors:**
- Verify script has execute permissions: `chmod +x script.sh`
- Check shebang line is present: `#!/bin/bash` or `#!/usr/bin/env python3`
- Confirm dependencies are installed (jq, prettier, etc.)

### 4. Best Practices Guidance

Provide education on hooks best practices from `references/hooks-guide.md`:

- Security: Input validation, absolute paths, secret protection
- Performance: Appropriate timeouts, parallel execution understanding
- Reliability: Error handling, exit codes, JSON output format
- Maintainability: Clear naming, documentation, version control

## When to Use This Skill

Trigger this skill when users request:

- **Review requests**: "Review my hooks configuration", "Check my hooks for issues", "Validate hooks setup"
- **Creation requests**: "Create a hook to format code before writing", "Set up a pre-commit hook", "Add session logging"
- **Troubleshooting**: "Why isn't my hook working?", "Hooks not triggering", "Debug hook errors"
- **Best practices**: "What are hooks best practices?", "How to secure my hooks?", "Optimize hook performance"
- **Event-specific**: Mentions of PreToolUse, PostToolUse, UserPromptSubmit, Stop, SubagentStop, SessionStart, SessionEnd, Notification, PreCompact

## Workflow Decision Tree

```
User Request
    │
    ├─ Review existing hooks
    │   └─> Load configuration → Apply checklist → Report findings
    │
    ├─ Create new hooks
    │   └─> Understand requirement → Select template → Customize → Validate
    │
    ├─ Troubleshoot hooks
    │   └─> Identify issue → Check common problems → Suggest fixes
    │
    └─ Learn best practices
        └─> Reference guides → Provide examples → Explain rationale
```

## Configuration Files Location

Hooks can be configured in three locations (merged in this priority order):

1. **`~/.claude/settings.json`** - User-wide global hooks
2. **`.claude/settings.json`** - Project-specific hooks (version controlled)
3. **`.claude/settings.local.json`** - Local overrides (git-ignored)

Always check which file the user wants to modify and why.

## Quick Reference: Hook Events

| Event | Trigger Timing | Common Use Cases |
|-------|---------------|------------------|
| `PreToolUse` | Before tool execution | Validation, security checks, formatting |
| `PostToolUse` | After tool execution | Verification, notifications, cleanup |
| `UserPromptSubmit` | User input submission | Input validation, logging |
| `Stop` | Main agent stops | Analytics, cleanup |
| `SubagentStop` | Subagent stops | Task completion tracking |
| `SessionStart` | Session begins | Initialization, environment setup |
| `SessionEnd` | Session ends | Cleanup, reporting |
| `Notification` | Notification sent | Custom integrations |
| `PreCompact` | Before context compaction | State preservation |

## Resources

### references/

Detailed documentation loaded as needed:

- **`hooks-guide.md`** - Comprehensive hooks documentation including all event types, input/output formats, security considerations, and advanced patterns
- **`review-checklist.md`** - Systematic evaluation criteria for hooks review including security, performance, and best practices checks
- **`review-report-template.md`** - Structured template for generating comprehensive review reports with severity-based findings and actionable recommendations

### assets/

Ready-to-use templates for common scenarios:

- **`hooks-templates/`** - Collection of example hooks configurations:
  - Pre-write formatting hooks
  - Pre-commit validation hooks
  - Session logging hooks
  - Notification integration hooks
  - Performance monitoring hooks

Load these templates when users need to create new hooks or want examples of well-structured configurations.

## Template Usage Guidelines

### Strict Requirements (Must Follow Exactly)

These elements have fixed syntax and must not be modified:

- **JSON Structure:** Hooks configuration must be valid JSON with proper nesting
- **Event Names:** Must use exact names from documentation
  - Valid: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`, `Notification`, `PreCompact`
  - Invalid: `PreTool`, `BeforeToolUse`, `pre-tool-use`
- **Exit Codes:** Shell scripts must use specific exit codes
  - `0` - Approve the action (stdout shown to user)
  - `2` - Block the action (stderr sent to Claude as feedback)
  - Other - Non-blocking error (stderr shown to user, action proceeds)
- **Hook Type:** Must be either `"command"` or `"prompt"`
- **Required Fields:** Each hook must have `type` and either `command` or `prompt`

### Flexible Customization (Adapt as Needed)

These elements should be customized for specific use cases:

- **Script Implementation:** Custom validation logic and business rules
- **Matcher Patterns:** Tool names and regex patterns based on requirements
  - Examples: `"Write"`, `"Write|Edit"`, `"Notebook.*"`, `"mcp__.*"`
- **Timeout Values:** Adjust based on operation complexity (default: 60000ms)
  - Fast checks: 1000-5000ms
  - Medium operations: 5000-30000ms
  - Heavy processing: 30000-120000ms
- **Error Messages:** User-friendly feedback for specific failure scenarios
- **Script Paths:** Absolute paths or `$CLAUDE_PROJECT_DIR` relative paths
- **Validation Rules:** Business-specific constraints and policies

### Best Practice Recommendations

- Start with templates and customize incrementally
- Test each modification with `claude --debug`
- Document custom validation rules in comments
- Version control hooks configurations (except `.local.json`)
- Use `.claude/settings.local.json` for personal/secret configurations

## Security Considerations

Always emphasize these security principles when reviewing or creating hooks:

1. **Never trust input** - Always validate JSON input structure
2. **Use absolute paths** - Avoid PATH-dependent script references
3. **Quote shell variables** - Prevent injection: `"$VARIABLE"` not `$VARIABLE`
4. **Protect secrets** - Never commit `.env` files or credentials
5. **Limit permissions** - Use minimum necessary access rights
6. **Set timeouts** - Prevent indefinite hangs (default: 60s)

Warn users about the responsibility of running arbitrary shell commands and the potential for data loss from malicious hooks.

## Dependencies

### Core Requirements

**jq** - JSON processing tool (used in shell script templates)

Installation:
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Fedora/RHEL
sudo dnf install jq
```

Verification:
```bash
jq --version
```

### Optional Tools (for Templates)

The hooks templates use the following tools when available. Templates gracefully degrade when these tools are not installed.

**prettier** - JavaScript/TypeScript formatting
```bash
npm install -g prettier
```

**black** - Python code formatting
```bash
pip install black
```

**gofmt** - Go code formatting (included with Go installation)
```bash
# Included with Go
go version
```

### Template-Specific Dependencies

- **`pre-write-format.json`**: Requires prettier (JS/TS), black (Python), or gofmt (Go)
- **`pre-commit-validation.json`**: No external dependencies
- **`session-logging.json`**: No external dependencies
- **`secret-protection.json`**: No external dependencies

All templates require:
- Bash shell (or compatible shell)
- `jq` for JSON processing

## Examples

### Example 1: Review Request

**User:** "Review my hooks configuration for security issues"

**Process:**
1. Read `.claude/settings.json` or specified file
2. Load `references/review-checklist.md`
3. Analyze against security criteria
4. Report findings with severity levels
5. Provide specific remediation examples

### Example 2: Creation Request

**User:** "Create a hook to run prettier before writing JavaScript files"

**Process:**
1. Identify event: `PreToolUse` for `Write|Edit` tools
2. Load `assets/hooks-templates/pre-write-format.json`
3. Customize for prettier + JavaScript pattern
4. Validate configuration structure
5. Explain testing approach

### Example 3: Troubleshooting

**User:** "My PreToolUse hook isn't blocking writes"

**Process:**
1. Review hook configuration
2. Check exit code logic (must be 2 for blocking)
3. Verify matcher pattern matches target tools
4. Confirm script permissions and path
5. Suggest debugging with `claude --debug`
