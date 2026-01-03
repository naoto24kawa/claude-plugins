#!/bin/bash
# Secret protection hook
# Prevents writing to files that commonly contain secrets

set -e

# Read JSON input from stdin
input=$(cat)

# Extract file path
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Exit if no file path
if [ -z "$file_path" ]; then
  exit 0
fi

# Get filename
filename=$(basename "$file_path")

# List of protected files/patterns
protected_patterns=(
  ".env"
  ".env.local"
  ".env.production"
  "credentials.json"
  "secrets.yaml"
  "id_rsa"
  "id_ed25519"
  ".pem"
  ".key"
  "serviceAccount.json"
)

# Check if file matches any protected pattern
for pattern in "${protected_patterns[@]}"; do
  if [[ "$filename" == *"$pattern"* ]]; then
    echo "🚫 Blocked: Cannot write to potentially sensitive file: $filename" >&2
    echo "Files containing secrets should be managed manually, not by Claude Code." >&2
    exit 2  # Block the write
  fi
done

echo "Secret protection check passed"
exit 0
