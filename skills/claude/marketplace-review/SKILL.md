---
name: marketplace-review
description: Validate .claude-plugin/marketplace.json structure and verify all referenced file paths exist. Use when reviewing marketplace configuration, checking plugin definitions, validating agent/skill paths, or ensuring marketplace.json integrity. Triggered by "marketplace validation", "check marketplace.json", "validate plugin paths", "verify marketplace structure".
---

# Marketplace Validator

## Table of Contents

1. [Overview](#overview)
2. [When to Use This Skill](#when-to-use-this-skill)
3. [Validation Process](#validation-process)
4. [Default Behavior](#default-behavior)
5. [What Gets Validated](#what-gets-validated)
6. [Common Issues and Solutions](#common-issues-and-solutions)
7. [Example Workflow](#example-workflow)
8. [Resources](#resources)

## Overview

Validate the structure and content of `.claude-plugin/marketplace.json` files, with special focus on verifying that all referenced file paths actually exist in the repository.

## When to Use This Skill

Use this skill when:
- Creating or updating `.claude-plugin/marketplace.json`
- Adding new plugins, skills, or agents to the marketplace
- Reviewing marketplace configuration before publishing
- Troubleshooting plugin installation issues
- Ensuring all paths in marketplace.json match actual files

## Validation Process

### Step 1: Locate Marketplace File

Find the marketplace.json file at `.claude-plugin/marketplace.json` in the repository root.

**検証**: Confirm that marketplace.json file exists at the expected location
**エラー時**:
- Check if you are in the repository root directory
- Verify that `.claude-plugin/` directory exists
- If the file is missing, it needs to be created

### Step 2: Run Validation Script

Execute the validation script:

```bash
python3 scripts/validate_marketplace.py .claude-plugin/marketplace.json
```

The script will check:
1. **JSON Syntax** - Valid JSON structure
2. **Required Fields** - Presence of `name`, `owner`, `plugins`
3. **Naming Conventions** - Kebab-case for names
4. **Version Format** - Semver format (e.g., "0.1.0")
5. **File Path Existence** - All referenced paths actually exist

**検証**: Verify the script starts without errors and completes execution
**エラー時**:
- Ensure Python 3 is installed (`python3 --version`)
- Check that the script path is correct relative to the skill directory
- Verify file permissions allow script execution

### Step 3: Review Results

The validator outputs:
- ✅ **PASSED** - All checks successful
- ⚠️ **Warnings** - Non-critical issues (recommended improvements)
- ❌ **Errors** - Critical issues that must be fixed

**検証**: Understand all reported errors and warnings
**次のステップ**: If errors exist, proceed to Step 4; if only warnings or passed, consider addressing warnings

### Step 4: Fix Issues

For each error or warning, the script provides:
- Clear description of the issue
- Expected file path location
- Specific plugin or field causing the issue

**検証**: After fixing each issue, re-run the validation script to confirm resolution
**エラー時**: Refer to "Common Issues and Solutions" section for specific guidance

## Default Behavior

Unless otherwise specified by the user, use the following default settings:

### Script Execution
- **Script Path**: `scripts/validate_marketplace.py` (relative to skill directory)
- **Target File**: `.claude-plugin/marketplace.json` (at repository root)
- **Working Directory**: Repository root directory
- **Python Version**: Python 3 (any version)

### Output Format
- **Success**: ✅ mark with "Validation PASSED" message
- **Warnings**: ⚠️ mark with list of warning messages
- **Errors**: ❌ mark with list of error messages
- **Detail Level**: Full detailed report including file paths and specific issues

### Exit Codes
- **0**: Validation successful (no errors, warnings allowed)
- **1**: Validation failed (one or more errors found)

### Validation Scope
By default, validate all aspects:
- JSON syntax and structure
- Required fields presence
- Naming conventions (kebab-case)
- Version format (semver)
- File path existence for all agents, skills, and mcpServers

## What Gets Validated

### Top-Level Structure

- `name` (required) - Marketplace identifier in kebab-case
- `owner` (required) - Object with `name` and optionally `email`
- `plugins` (required) - Array of plugin definitions

### Each Plugin Entry

**Required fields:**
- `name` - Plugin identifier in kebab-case
- `source` - Plugin source location

**Optional fields:**
- `description` - Plugin description
- `version` - Semantic version (e.g., "0.1.0")
- `agents` - Array of agent file paths
- `skills` - Array of skill directory paths
- `mcpServers` - MCP server configuration path

### Path Validation

**Agent Paths** (`agents` array):
- Must be an array of strings
- Each path must point to an existing `.md` file
- Example: `"./skills/review/ts-code-review/agents/review-srp-reviewer.md"`

**Skill Paths** (`skills` array):
- Must be an array of strings
- Each path must point to an existing directory
- Directory must contain a `SKILL.md` file
- Example: `"./skills/review/ts-code-review"`

**MCP Server Paths** (`mcpServers`):
- Must be a string
- Must point to an existing `.json` file
- Example: `"./skills/test/test-with-playwright/.mcp.json"`

## Common Issues and Solutions

### Issue: "Agent file not found"

**Cause:** Path in `agents` array doesn't match actual file location

**Solution:**
1. Check the actual file path in the repository
2. Update the path in marketplace.json to match
3. Ensure the path uses `./` prefix for relative paths

### Issue: "Missing SKILL.md in skill directory"

**Cause:** Skill directory exists but lacks required SKILL.md file

**Solution:**
1. Create SKILL.md in the skill directory
2. Include required YAML frontmatter with `name` and `description`

### Issue: "MCP server file not found"

**Cause:** mcpServers path doesn't point to existing .mcp.json file

**Solution:**
1. Verify .mcp.json exists at specified path
2. Update marketplace.json path if needed
3. Create .mcp.json if missing

### Issue: "Name should be in kebab-case"

**Cause:** Plugin or marketplace name uses incorrect format

**Solution:**
- Use lowercase with hyphens: `my-plugin-name`
- Avoid: camelCase, snake_case, spaces

## Example Workflow

When adding a new plugin to marketplace.json:

1. Add plugin entry with name, description, version, source
2. Add paths to `agents` array for each agent markdown file
3. Add paths to `skills` array for each skill directory
4. Add `mcpServers` path if the plugin includes MCP configuration
5. Run validation script: `python3 scripts/validate_marketplace.py .claude-plugin/marketplace.json`
6. Fix any reported errors
7. Address warnings for best practices
8. Commit changes when validation passes

## Resources

### scripts/validate_marketplace.py

Python validation script that performs comprehensive checks on marketplace.json structure and file paths. Can be executed directly without loading into context.

**Usage:**
```bash
python3 scripts/validate_marketplace.py <path-to-marketplace.json>
```

**Output:**
- Detailed validation report
- List of errors and warnings
- Exit code 0 for success, 1 for failure
