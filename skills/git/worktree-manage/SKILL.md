---
name: worktree-manage
description: Manage git worktrees for parallel development workflows, including feature branches, hotfixes, and code reviews. Use this skill when users request to create worktrees, list existing worktrees, switch between worktrees, remove worktrees, or need to work on multiple branches simultaneously. Triggered by phrases like "create worktree", "new worktree", "worktree list", "switch worktree", "remove worktree", "multiple branches", "parallel development", or "work on different branches".
---

# Managing Git Worktrees

## Table of Contents
- [Overview](#overview)
- [When to Use This Skill](#when-to-use-this-skill)
- [Default Behavior](#default-behavior)
- [Core Workflows](#core-workflows)
  - [1. Creating a New Worktree](#1-creating-a-new-worktree)
  - [2. Listing and Inspecting Worktrees](#2-listing-and-inspecting-worktrees)
  - [3. Working with Worktrees](#3-working-with-worktrees)
  - [4. Removing Worktrees](#4-removing-worktrees)
- [Best Practices](#best-practices)
- [Decision Tree](#decision-tree)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [Quick Reference](#quick-reference)
- [Summary](#summary)

## Overview

Enable efficient parallel development by managing git worktrees - multiple working directories attached to the same repository. Work on different branches simultaneously without the overhead of cloning or constant branch switching.

## When to Use This Skill

Use this skill for:
- Creating new worktrees for feature branches, hotfixes, or experiments
- Listing and inspecting existing worktrees
- Switching between different worktrees
- Cleaning up unused worktrees
- Managing multiple branches in parallel

Common user requests:
- "Create a new worktree for feature X"
- "Show me all worktrees"
- "I need to work on a different branch without losing my current work"
- "Remove old worktrees"
- "Help me set up parallel development"

## Default Behavior

Unless the user specifies otherwise:

### Worktree Creation
- Worktrees are created as siblings to the main repository directory
- Branch names follow the worktree directory name if not specified
- Validation checks are performed before creation

### Worktree Management
- Protected branches (main, master, develop, production) are never automatically removed
- Interactive mode is recommended for first-time users
- Dry-run options are available for safe preview before execution

### Scripts
- `create_worktree.sh`: Interactive mode by default
- `cleanup_worktrees.sh`: Safe mode with confirmation prompts
- All scripts provide `--help` for detailed usage information

## Core Workflows

### 1. Creating a New Worktree

To create a new worktree, use the included automation script which follows best practices:

```bash
# Interactive mode (recommended for first-time users)
bash scripts/create_worktree.sh

# Command-line mode
bash scripts/create_worktree.sh <worktree-name> [branch-name] [base-branch]
```

**Examples:**

```bash
# Create worktree with automatic branch naming
bash scripts/create_worktree.sh feature-auth

# Create worktree with custom branch name
bash scripts/create_worktree.sh feature-auth feature/user-authentication

# Create hotfix from production branch
bash scripts/create_worktree.sh hotfix-bug hotfix/critical-bug origin/production
```

The script will:
- Validate the worktree name and location
- Check for conflicts with existing worktrees
- Create the worktree as a sibling to the main repository
- Provide next steps and usage guidance

**Manual creation (without script):**

```bash
# Create new branch and worktree
git worktree add ../feature-name -b feature/description

# Checkout existing branch in new worktree
git worktree add ../existing-feature feature/existing

# Create worktree from specific commit
git worktree add ../hotfix-123 -b hotfix/issue-123 abc1234
```

### 2. Listing and Inspecting Worktrees

**List all worktrees:**

```bash
# Simple list
git worktree list

# Detailed list with porcelain format
git worktree list --porcelain
```

**Using the cleanup script for detailed inspection:**

```bash
# List with additional status information
bash scripts/cleanup_worktrees.sh --list
```

Output shows:
- Worktree paths
- Associated branches
- Current HEAD commit
- Status (current, missing directory, locked)

### 3. Working with Worktrees

**Switch between worktrees:**

Simply change directories to the worktree location:

```bash
# List worktrees to find the path
git worktree list

# Navigate to desired worktree
cd /path/to/worktree-name

# Or use relative path if worktrees are siblings
cd ../feature-name
```

**Check status across worktrees:**

```bash
# From main repository
for worktree in $(git worktree list | awk '{print $1}'); do
    echo "=== $worktree ==="
    (cd "$worktree" && git status -s)
done
```

### 4. Removing Worktrees

**Using the cleanup script (recommended):**

```bash
# Interactive mode - select which worktrees to remove
bash scripts/cleanup_worktrees.sh --interactive

# Dry-run to see what would be removed
bash scripts/cleanup_worktrees.sh --dry-run --all

# Remove all non-protected worktrees
bash scripts/cleanup_worktrees.sh --all

# Prune only (clean up metadata for manually deleted directories)
bash scripts/cleanup_worktrees.sh --prune
```

**Manual removal:**

```bash
# Remove specific worktree
git worktree remove ../feature-name

# Force remove (if directory is missing or locked)
git worktree remove --force ../feature-name

# Prune metadata for manually deleted worktrees
git worktree prune
```

**Important:** Always use `git worktree remove` instead of manually deleting directories to keep git metadata in sync.

## Best Practices

To follow established patterns and avoid common pitfalls, refer to the comprehensive guide:

```bash
# Read best practices and patterns
cat references/worktree-patterns.md
```

Key guidelines include:
- **Directory naming conventions** for different types of work
- **Recommended directory structures** (sibling layout vs bare repository)
- **Common workflows** for features, hotfixes, and parallel reviews
- **Troubleshooting** orphaned worktrees, locked worktrees, disk space
- **Advanced patterns** for bare repositories, sparse checkouts, CI/CD integration

The reference document provides detailed examples and explanations for each pattern.

## Decision Tree

Use this decision tree to determine the appropriate action:

```
Need to work on different code simultaneously?
├─ Yes → Create new worktree
│   ├─ New feature/branch? → Use create_worktree.sh with new branch
│   └─ Existing branch? → Use create_worktree.sh with existing branch
│
├─ Want to see all worktrees? → git worktree list OR cleanup script --list
│
├─ Switch to different work? → cd to worktree directory
│
├─ Done with a worktree?
│   ├─ One worktree → git worktree remove <path>
│   ├─ Multiple worktrees → Use cleanup script --interactive
│   └─ All old worktrees → Use cleanup script --all (with --dry-run first)
│
└─ Manually deleted directory? → git worktree prune
```

## Common Scenarios

### Scenario 1: Feature Development

```bash
# Start new feature
bash scripts/create_worktree.sh feature-api feature/api-endpoints main

# Work on feature
cd ../feature-api
# ... make changes, commit, test ...

# Continue work on main while feature is in review
cd ../main
# ... other work ...

# Feature merged, clean up
bash scripts/cleanup_worktrees.sh --interactive
# Select the feature-api worktree to remove
```

### Scenario 2: Urgent Hotfix

```bash
# Create hotfix from production
bash scripts/create_worktree.sh hotfix-security hotfix/cve-fix origin/production

# Apply fix
cd ../hotfix-security
# ... fix, test, commit ...
git push origin hotfix/cve-fix

# Create PR, merge, then clean up
git worktree remove ../hotfix-security
git branch -d hotfix/cve-fix
```

### Scenario 3: Reviewing Multiple PRs

```bash
# Review first PR
git worktree add ../review-pr-123 pr-123

# Review second PR
git worktree add ../review-pr-456 pr-456

# Switch between reviews
cd ../review-pr-123  # Review first
cd ../review-pr-456  # Review second

# Clean up when done
bash scripts/cleanup_worktrees.sh --interactive
```

### Scenario 4: Cleanup After Manual Deletion

```bash
# Someone manually deleted worktree directories
# Git still has metadata

# See orphaned entries
git worktree list
# Shows entries for non-existent directories

# Clean up metadata
bash scripts/cleanup_worktrees.sh --prune
# Or manually: git worktree prune
```

## Troubleshooting

### Worktree Creation Fails

**Issue:** `fatal: '<path>' already exists`

**Solution:**
- Check if directory already exists: `ls -la <path>`
- Remove directory if safe: `rm -rf <path>`
- Or choose different name

**Issue:** `fatal: invalid reference: <branch>`

**Solution:**
- Branch doesn't exist
- Check available branches: `git branch -a`
- Create branch first or use different base branch

### Cannot Remove Worktree

**Issue:** `fatal: '<path>' is dirty, use --force to delete it`

**Solution:**
- Commit or stash changes in that worktree
- Or use force remove: `git worktree remove --force <path>`

**Issue:** `fatal: validation failed, cannot remove working tree`

**Solution:**
- Worktree is current directory
- Switch to different worktree first: `cd ../other-worktree`
- Then remove: `git worktree remove <path>`

### Locked Worktrees

**Issue:** Worktree shows as locked in `git worktree list`

**Solution:**
```bash
# Unlock the worktree
git worktree unlock <path>

# Or force remove
git worktree remove --force <path>
```

### Orphaned Worktree Metadata

**Issue:** Git shows worktrees for non-existent directories

**Solution:**
```bash
# Prune orphaned entries
git worktree prune --verbose

# Or use cleanup script
bash scripts/cleanup_worktrees.sh --prune
```

## Resources

### scripts/

**create_worktree.sh**: Interactive worktree creation with validation
- Validates names and checks for conflicts
- Supports both interactive and command-line modes
- Creates worktrees following best practices
- Provides helpful next steps

**cleanup_worktrees.sh**: Comprehensive cleanup and maintenance
- Interactive selection of worktrees to remove
- Dry-run mode for safe preview
- Automatic protection of main/master branches
- Metadata pruning for orphaned entries

**Make scripts executable:**
```bash
chmod +x scripts/*.sh
```

### references/

**worktree-patterns.md**: Comprehensive best practices guide
- Directory structure patterns
- Naming conventions for different types of work
- Common workflows (features, hotfixes, parallel reviews)
- Advanced patterns (bare repositories, sparse checkouts, CI/CD)
- Troubleshooting common issues
- Performance considerations

Load this reference when users need detailed guidance:
```bash
cat references/worktree-patterns.md
```

## Quick Reference

| Operation | Command |
|-----------|---------|
| Create worktree (interactive) | `bash scripts/create_worktree.sh` |
| Create worktree (command-line) | `bash scripts/create_worktree.sh <name> [branch] [base]` |
| List worktrees | `git worktree list` |
| List with details | `bash scripts/cleanup_worktrees.sh --list` |
| Remove worktree | `git worktree remove <path>` |
| Interactive cleanup | `bash scripts/cleanup_worktrees.sh --interactive` |
| Prune metadata | `git worktree prune` |
| Unlock worktree | `git worktree unlock <path>` |
| Force remove | `git worktree remove --force <path>` |

## Summary

This skill provides comprehensive git worktree management through:
1. **Automated creation** with validation and best practices
2. **Detailed inspection** of worktree status and metadata
3. **Safe cleanup** with interactive selection and dry-run
4. **Reference guide** for patterns and troubleshooting

Use the scripts for common operations and refer to the patterns guide for advanced scenarios.
