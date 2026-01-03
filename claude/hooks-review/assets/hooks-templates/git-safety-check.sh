#!/bin/bash
# Git command safety validation hook
# Prevents dangerous git operations

set -e

# Read JSON input from stdin
input=$(cat)

# Extract bash command
command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Exit if no command
if [ -z "$command" ]; then
  exit 0
fi

# Only check git commands
if [[ ! "$command" =~ ^git ]]; then
  exit 0
fi

# Dangerous patterns to block
dangerous_patterns=(
  "git push.*--force"
  "git push.*-f[^a-z]"
  "git reset.*--hard"
  "git clean.*-fd"
  "git branch.*-D"
  "git rebase.*-i"
)

for pattern in "${dangerous_patterns[@]}"; do
  if [[ "$command" =~ $pattern ]]; then
    echo "⚠️  Dangerous git operation detected: $command" >&2
    echo "This operation could cause data loss. Please review carefully." >&2
    exit 2  # Block the operation
  fi
done

# Warn about force push to main/master
if [[ "$command" =~ git\ push.*--force ]] && [[ "$command" =~ (main|master) ]]; then
  echo "🚫 Force push to main/master branch is not allowed" >&2
  exit 2
fi

echo "Git command safety check passed"
exit 0
