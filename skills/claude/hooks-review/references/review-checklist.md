# Hooks Configuration Review Checklist

This checklist provides systematic evaluation criteria for reviewing Claude Code hooks configurations. Use this to identify security vulnerabilities, performance issues, correctness problems, and best practice violations.

## Review Dimensions

Evaluate hooks across four key dimensions:

1. **Security** - Vulnerabilities that could lead to data loss or compromise
2. **Performance** - Issues affecting execution speed and resource usage
3. **Correctness** - Problems preventing hooks from working as intended
4. **Best Practices** - Violations of recommended patterns and conventions

## Security Review

### Critical Issues (Severity: Critical)

**❌ Unquoted Shell Variables**

Allows command injection through variable expansion.

```json
// ❌ Bad
{
  "command": "cat $CLAUDE_PROJECT_DIR/file.txt"
}

// ✅ Good
{
  "command": "cat \"$CLAUDE_PROJECT_DIR/file.txt\""
}
```

**Remediation:** Quote all shell variables: `"$VAR"` not `$VAR`

---

**❌ Hardcoded Secrets**

API keys, passwords, or tokens in configuration files.

```json
// ❌ Bad
{
  "command": "curl -H 'Authorization: Bearer sk-abc123' https://api.example.com"
}

// ✅ Good - Use environment variables
{
  "command": "curl -H \"Authorization: Bearer $API_TOKEN\" https://api.example.com"
}
```

**Remediation:** Use environment variables, never commit secrets

---

**❌ Executing User Input Without Validation**

Directly using user-provided data in shell commands.

```bash
# ❌ Bad
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
cat $file_path
```

```bash
# ✅ Good
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
# Validate input
if [[ "$file_path" =~ ^[a-zA-Z0-9/_.-]+$ ]]; then
  cat "$file_path"
else
  echo "Invalid file path" >&2
  exit 1
fi
```

**Remediation:** Always validate, sanitize, and quote user inputs

---

**❌ Writing to Sensitive Files**

Hooks that could modify `.env`, credentials, or system files.

```json
// ❌ Bad - No protection
{
  "hooks": {
    "PreToolUse": {
      "Write": [/* no validation */]
    }
  }
}

// ✅ Good - Explicit protection
{
  "command": "if [[ \"$file\" == *.env ]]; then exit 2; fi"
}
```

**Remediation:** Add explicit checks to prevent writing sensitive files

---

### High Severity Security Issues

**❌ PATH-Dependent Script References**

Vulnerable to PATH manipulation attacks.

```json
// ❌ Bad
{
  "command": "prettier --check"
}

// ✅ Good
{
  "command": "/usr/local/bin/prettier --check"
}

// ✅ Also good
{
  "command": "$CLAUDE_PROJECT_DIR/node_modules/.bin/prettier --check"
}
```

**Remediation:** Use absolute paths or `$CLAUDE_PROJECT_DIR` prefix

---

**❌ Missing Input Validation**

Scripts that don't validate JSON structure.

```python
# ❌ Bad
import sys, json
data = json.load(sys.stdin)
file_path = data['tool_input']['file_path']  # No validation
```

```python
# ✅ Good
import sys, json

try:
    data = json.load(sys.stdin)
    if 'tool_input' not in data or 'file_path' not in data['tool_input']:
        sys.exit(1)
    file_path = data['tool_input']['file_path']
except (json.JSONDecodeError, KeyError):
    sys.exit(1)
```

**Remediation:** Always validate JSON structure and required fields

---

**❌ Overly Permissive Matchers**

Wildcards or patterns that match more than intended.

```json
// ❌ Bad - Matches ALL tools
{
  "hooks": {
    "PreToolUse": {
      "*": [/* security check */]
    }
  }
}

// ✅ Good - Specific tools only
{
  "hooks": {
    "PreToolUse": {
      "Write|Edit": [/* security check */]
    }
  }
}
```

**Remediation:** Use specific matchers; avoid `*` unless necessary

---

## Performance Review

### High Severity Performance Issues

**❌ Missing or Excessive Timeouts**

Could cause indefinite hangs or premature termination.

```json
// ❌ Bad - No timeout (defaults to 60s)
{
  "type": "command",
  "command": "long-running-task.sh"
}

// ❌ Bad - Excessive timeout
{
  "type": "command",
  "command": "quick-check.sh",
  "timeout": 600000  // 10 minutes for a quick check
}

// ✅ Good - Appropriate timeout
{
  "type": "command",
  "command": "format-check.sh",
  "timeout": 5000  // 5 seconds for formatting
}
```

**Remediation:** Set timeouts appropriate to task duration

---

**❌ Synchronous Heavy Operations**

Blocking hooks for operations that could be async.

```json
// ❌ Bad - Sync upload blocking writes
{
  "PostToolUse": {
    "Write": [
      {
        "command": "rsync -av file remote-server:/backup"  // Slow network operation
      }
    ]
  }
}

// ✅ Good - Background upload
{
  "PostToolUse": {
    "Write": [
      {
        "command": "echo \"file\" >> /tmp/upload-queue"  // Fast queue operation
      }
    ]
  }
}
```

**Remediation:** Use queues or background jobs for slow operations

---

### Medium Severity Performance Issues

**❌ Redundant Hook Executions**

Same check running multiple times unnecessarily.

```json
// ❌ Bad - Duplicate security checks
{
  "PreToolUse": {
    "Write": [
      {"command": "security-scan.sh"},
      {"command": "security-scan.sh"}  // Duplicate
    ]
  }
}

// ✅ Good - Single check
{
  "PreToolUse": {
    "Write": [
      {"command": "security-scan.sh"}
    ]
  }
}
```

**Remediation:** Remove duplicate hooks, consolidate checks

---

**❌ Inefficient Script Implementation**

Scripts with unnecessary overhead.

```bash
# ❌ Bad - Spawning multiple processes
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
file_size=$(ls -lh "$file_path" | awk '{print $5}')
file_type=$(file "$file_path" | cut -d: -f2)
```

```bash
# ✅ Good - Efficient single-pass processing
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
stat_output=$(stat -f "%z %HT" "$file_path")
```

**Remediation:** Optimize scripts to minimize subprocess spawning

---

## Correctness Review

### High Severity Correctness Issues

**❌ Incorrect Exit Codes**

Wrong exit codes preventing intended blocking behavior.

```bash
# ❌ Bad - Exit 1 doesn't block (non-blocking error)
if [[ "$file" == *.env ]]; then
  echo "Cannot write .env files" >&2
  exit 1  # Should be 2 to block
fi
```

```bash
# ✅ Good - Exit 2 blocks
if [[ "$file" == *.env ]]; then
  echo "Cannot write .env files" >&2
  exit 2  # Blocks the operation
fi
```

**Remediation:** Use exit code 2 for blocking, 0 for approval

---

**❌ Malformed JSON Output**

Invalid JSON for Stop/SubagentStop prompt hooks.

```json
// ❌ Bad - Missing required fields
{
  "decision": "block"
  // Missing "reason" field
}

// ✅ Good - Complete structure
{
  "decision": "block",
  "reason": "Cost limit exceeded"
}
```

**Remediation:** Include all required fields in JSON output

---

**❌ Invalid Event/Matcher Combinations**

Hooks registered for non-existent events or wrong tool names.

```json
// ❌ Bad - Typo in event name
{
  "hooks": {
    "PreToolUse": {  // Correct
      "Write": [...]
    },
    "PreToolUsage": {  // ❌ Wrong - doesn't exist
      "Edit": [...]
    }
  }
}

// ✅ Good - Correct event names
{
  "hooks": {
    "PreToolUse": {
      "Write|Edit": [...]
    }
  }
}
```

**Remediation:** Verify event names against documentation

---

**❌ Script Path Errors**

Referencing non-existent scripts or wrong paths.

```json
// ❌ Bad - Relative path (unreliable)
{
  "command": "./scripts/validate.sh"
}

// ❌ Bad - Non-existent path
{
  "command": "/path/that/does/not/exist.sh"
}

// ✅ Good - Absolute path or $CLAUDE_PROJECT_DIR
{
  "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/validate.sh"
}
```

**Remediation:** Use absolute paths, verify scripts exist

---

### Medium Severity Correctness Issues

**❌ Missing Error Handling**

Scripts that don't handle errors gracefully.

```python
# ❌ Bad - No error handling
import sys, json
data = json.load(sys.stdin)
file_path = data['tool_input']['file_path']  # Could raise KeyError
```

```python
# ✅ Good - Proper error handling
import sys, json

try:
    data = json.load(sys.stdin)
    file_path = data['tool_input']['file_path']
except (json.JSONDecodeError, KeyError) as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
```

**Remediation:** Add try/catch blocks and proper error messages

---

**❌ Incorrect Regex Patterns**

Matcher patterns that don't match intended tools.

```json
// ❌ Bad - Missing escape, matches "Notebook" literally
{
  "hooks": {
    "PreToolUse": {
      "Notebook.": [...]  // . matches any character
    }
  }
}

// ✅ Good - Properly escaped
{
  "hooks": {
    "PreToolUse": {
      "Notebook.*": [...]  // Matches all Notebook tools
    }
  }
}
```

**Remediation:** Test regex patterns, escape special characters

---

## Best Practices Review

### High Priority Best Practices

**❌ No Documentation**

Missing comments or documentation for complex hooks.

```json
// ❌ Bad - No context
{
  "PreToolUse": {
    "Bash": [
      {"command": "complex-validation.sh"}
    ]
  }
}
```

```json
// ✅ Good - Documented with comments (in actual settings file)
// This hook validates bash commands for security issues
// before execution, preventing accidental destructive operations
{
  "PreToolUse": {
    "Bash": [
      {"command": "$CLAUDE_PROJECT_DIR/.claude/hooks/bash-safety-check.sh"}
    ]
  }
}
```

**Remediation:** Add comments explaining hook purpose and behavior

---

**❌ Global Settings for Project-Specific Hooks**

Project-specific hooks in `~/.claude/settings.json` instead of `.claude/settings.json`.

**Issue:** Hooks apply to all projects, not just the intended one.

**Remediation:** Move project-specific hooks to `.claude/settings.json`

---

**❌ Secrets in Version-Controlled Files**

Sensitive data in `.claude/settings.json` (version controlled).

```json
// ❌ Bad - In .claude/settings.json (version controlled)
{
  "hooks": {
    "SessionStart": [
      {"command": "curl -H 'Authorization: Bearer secret123' ..."}
    ]
  }
}
```

**Remediation:** Move to `.claude/settings.local.json` (git-ignored)

---

### Medium Priority Best Practices

**❌ Inconsistent Naming**

Hook scripts with unclear or inconsistent names.

```
❌ Bad naming:
- script1.sh
- check.py
- validate.sh
```

```
✅ Good naming:
- pre-write-format-check.sh
- post-commit-notification.py
- pre-bash-security-scan.sh
```

**Remediation:** Use descriptive, consistent naming conventions

---

**❌ Missing Script Permissions**

Scripts without execute permissions.

```bash
# Check permissions
ls -l .claude/hooks/script.sh
# -rw-r--r--  # ❌ Not executable

# Fix
chmod +x .claude/hooks/script.sh
# -rwxr-xr-x  # ✅ Executable
```

**Remediation:** Ensure all hook scripts have execute permissions

---

**❌ Lack of Testing**

Hooks deployed without testing in isolated environment.

**Remediation Steps:**

1. Test hooks in development environment first
2. Use `claude --debug` to verify execution
3. Test both success and failure paths
4. Validate exit codes and output
5. Check performance impact

---

## Severity Definitions

**Critical:** Could lead to data loss, security compromise, or system damage
- **Action Required:** Fix immediately before deployment
- **Examples:** Command injection, hardcoded secrets, unvalidated user input

**High:** Significant issues affecting functionality, security, or performance
- **Action Required:** Fix before production use
- **Examples:** Missing input validation, incorrect exit codes, PATH-dependent references

**Medium:** Issues affecting code quality or minor functionality problems
- **Action Required:** Fix in next iteration
- **Examples:** Missing documentation, inefficient scripts, naming inconsistencies

**Low:** Minor improvements or suggestions
- **Action Required:** Consider for future enhancement
- **Examples:** Code style, optimization opportunities

## Review Report Template

When completing a review, structure findings as:

```markdown
# Hooks Configuration Review Report

## Summary
- Total hooks reviewed: X
- Critical issues: X
- High severity: X
- Medium severity: X
- Low severity: X

## Critical Issues

### 1. [Issue Title]
**Location:** hooks.PreToolUse.Write[0]
**Severity:** Critical
**Description:** [What's wrong]
**Risk:** [Security/Data loss risk]
**Remediation:** [How to fix with code example]

## High Severity Issues

### 1. [Issue Title]
**Location:** hooks.PostToolUse.Bash[0]
**Severity:** High
**Description:** [What's wrong]
**Impact:** [Functional/Performance impact]
**Remediation:** [How to fix with code example]

## Recommendations

1. [Priority recommendations]
2. [Best practice suggestions]

## Positive Findings

- [Well-implemented patterns]
- [Good practices observed]
```

## Automated Checks

If implementing automated hooks validation, check for:

1. **JSON Validity:** Proper JSON structure
2. **Required Fields:** All mandatory fields present
3. **Event Names:** Valid event names from documentation
4. **Exit Code Logic:** Scripts return 0, 2, or other codes appropriately
5. **Path Validation:** Referenced scripts exist and are executable
6. **Timeout Ranges:** Timeouts between 1000-600000ms
7. **Regex Validity:** Matcher patterns are valid regex
8. **Variable Quoting:** Shell variables properly quoted

## Additional Resources

For hook implementation examples demonstrating best practices, see:
`assets/hooks-templates/`
