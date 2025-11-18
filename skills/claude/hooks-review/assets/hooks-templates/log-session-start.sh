#!/bin/bash
# Session start logging hook
# Records when Claude Code sessions begin

set -e

# Read JSON input from stdin
input=$(cat)

# Extract session ID
session_id=$(echo "$input" | jq -r '.session_id')

# Log directory
log_dir="$HOME/.claude/logs"
mkdir -p "$log_dir"

# Create log entry
timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
log_file="$log_dir/sessions.jsonl"

# Append session start event
echo "{\"event\":\"session_start\",\"session_id\":\"$session_id\",\"timestamp\":\"$timestamp\"}" >> "$log_file"

echo "Session started: $session_id"
exit 0
