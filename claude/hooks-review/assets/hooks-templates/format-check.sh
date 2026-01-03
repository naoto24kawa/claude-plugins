#!/bin/bash
# Pre-write formatting validation hook
# Checks if files match project formatting standards before writing

set -e

# Read JSON input from stdin
input=$(cat)

# Extract file path and content
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Exit if no file path (tool might not be Write/Edit)
if [ -z "$file_path" ]; then
  exit 0
fi

# Determine file type
extension="${file_path##*.}"

case "$extension" in
  js|jsx|ts|tsx)
    # JavaScript/TypeScript - use prettier if available
    if command -v prettier >/dev/null 2>&1; then
      echo "Checking formatting with prettier..."
      if ! prettier --check "$file_path" 2>&1; then
        echo "File formatting issues detected. Run 'prettier --write \"$file_path\"' to fix." >&2
        exit 2  # Block the write
      fi
    fi
    ;;
  py)
    # Python - use black if available
    if command -v black >/dev/null 2>&1; then
      echo "Checking formatting with black..."
      if ! black --check "$file_path" 2>&1; then
        echo "File formatting issues detected. Run 'black \"$file_path\"' to fix." >&2
        exit 2  # Block the write
      fi
    fi
    ;;
  go)
    # Go - use gofmt
    if command -v gofmt >/dev/null 2>&1; then
      echo "Checking formatting with gofmt..."
      if ! gofmt -l "$file_path" | grep -q .; then
        echo "File formatting issues detected. Run 'gofmt -w \"$file_path\"' to fix." >&2
        exit 2  # Block the write
      fi
    fi
    ;;
esac

echo "Formatting check passed"
exit 0
