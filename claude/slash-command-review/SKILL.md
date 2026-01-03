---
name: slash-command-review
description: Review Claude Code slash command implementations against best practices across six dimensions: metadata quality, argument handling, dynamic features (Bash/file integration), security, scope, and skill boundary. Provides A-F grades with actionable recommendations. Use when users request "slash command review," "validate slash command," "check command quality," "review .claude/commands/," or mention command evaluation or standards compliance.
---

# Slash Command Review

## Overview

Evaluate Claude Code slash command implementations against established best practices and security standards. This skill provides comprehensive, multi-dimensional analysis of slash command files (`.claude/commands/*.md`), identifying strengths and weaknesses with actionable improvement recommendations.

## When to Use This Skill

Use this skill when:
- User explicitly requests slash command review or quality check
- User asks to "validate," "evaluate," or "audit" slash commands
- User mentions `.claude/commands/` directory or specific command files
- User wants to ensure commands follow best practices
- User needs security assessment of slash commands
- User asks to compare command implementation against standards

## Review Workflow

### Step 1: Identify Target Commands

Determine which slash command files to review:

1. **User specifies a file**: Review the specified `.claude/commands/*.md` file
2. **User specifies a directory**: Review all `.md` files in that directory
3. **User says "all commands"**: Use Glob to find all files matching `.claude/commands/**/*.md`
4. **User provides command name**: Locate the corresponding file (e.g., `/component` → `.claude/commands/component.md`)

**Actions**:
- Use Glob tool to locate slash command files: `.claude/commands/**/*.md`
- Read each target file using Read tool
- If files don't exist or directory is empty, inform the user

### Step 2: Parse Command Structure

For each command file, extract and analyze:

1. **Frontmatter** (YAML between `---` delimiters):
   - `description`: Command purpose
   - `argument-hint`: Expected argument pattern
   - `model`: Model selection (haiku/sonnet/opus)
   - `allowed-tools`: Tool restrictions
   - `disable-model-invocation`: Auto-invocation prevention

2. **Command Body** (Markdown content):
   - Argument usage (`$ARGUMENTS`, `$1`, `$2`, etc.)
   - Bash integration (`!` prefix commands)
   - File references (`@` prefix paths)
   - Instructions and workflow steps

3. **File Location**:
   - Scope (`.claude/commands/` vs `~/.claude/commands/`)
   - Namespace (subdirectories)

### Step 3: Evaluate Against Six Dimensions

For each dimension, assign a grade (A-F) based on the criteria in `references/evaluation-criteria.md`.

#### Dimension 1: Frontmatter Quality

**What to check**:
- YAML format correctness (`---` delimiters, valid syntax)
- `description` existence and clarity
- `argument-hint` presence when arguments are used
- `model` selection appropriateness
- `allowed-tools` restrictions when needed
- `disable-model-invocation` when appropriate

**Read**: `references/evaluation-criteria.md` for detailed grading criteria

**Common issues**:
- Missing or vague `description`
- No `argument-hint` despite using arguments
- YAML syntax errors
- Inappropriate model selection for task complexity

#### Dimension 2: Argument Handling

**What to check**:
- Correct use of `$ARGUMENTS` vs `$1`, `$2`, etc.
- Clear explanation of expected arguments
- Validation or guidance for argument values
- Default value handling
- Required vs optional arguments clarity

**Read**: `references/best-practices.md` (section: "Dynamic Features > Argument Processing")

**Common issues**:
- Arguments used without explanation
- No validation or constraints
- Confusing required/optional distinction
- Incorrect variable syntax

#### Dimension 3: Dynamic Features

**What to check**:
- Safe use of `!` prefix (Bash commands)
- Appropriate use of `@` prefix (file references)
- Error handling for command failures
- Avoidance of long-running commands
- Proper file path restrictions

**Read**: `references/best-practices.md` (sections: "Bash Integration", "File References")

**Common issues**:
- Dangerous Bash commands (`rm -rf`, etc.)
- No error handling
- Arbitrary file access
- Long-running commands blocking execution

#### Dimension 4: Scope and Structure

**What to check**:
- Appropriate scope selection (project vs personal)
- Effective use of namespaces (subdirectories)
- File naming consistency
- Single responsibility principle adherence

**Read**: `references/best-practices.md` (section: "File Structure")

**Common issues**:
- Wrong scope for the command's purpose
- Missing namespace organization
- Unclear file naming
- Multiple responsibilities in one command

#### Dimension 5: Skill Boundary

**What to check**:
- Appropriate complexity for slash command
- Single-file completeness
- No multi-step workflows requiring external scripts
- Recommendation for skill conversion if too complex

**Read**: `references/best-practices.md` (section: "Slash Command vs Skill")

**Common issues**:
- Too complex (should be a skill)
- Multiple workflow steps
- External script dependencies
- Large amounts of procedural logic

#### Dimension 6: Security and Best Practices

**What to check**:
- Command injection prevention
- File access restrictions
- `allowed-tools` appropriate usage
- Input validation
- Dangerous operation warnings

**Read**: `references/best-practices.md` (section: "Security Best Practices")

**Common issues**:
- Command injection vulnerabilities
- Unrestricted file access
- No `allowed-tools` when needed
- Missing input validation
- Data loss risks

### Step 4: Generate Review Report

Create a comprehensive review report for each command file:

#### Report Structure

```markdown
# Slash Command Review Report

**Command**: <command-name>
**File**: <file-path>
**Overall Grade**: <A-F>

---

## Summary

<2-3 sentence overview of command quality and primary findings>

## Dimension Grades

| Dimension | Grade | Status |
|-----------|-------|--------|
| Frontmatter Quality | <A-F> | <emoji> |
| Argument Handling | <A-F> | <emoji> |
| Dynamic Features | <A-F> | <emoji> |
| Scope and Structure | <A-F> | <emoji> |
| Skill Boundary | <A-F> | <emoji> |
| Security & Best Practices | <A-F> | <emoji> |

**Overall Grade**: <A-F>

<emoji> = ✅ (A-B), ⚠️ (C), ❌ (D-F)

---

## Detailed Analysis

### 1. Frontmatter Quality (<Grade>)

**Findings**:
- <Specific observations>

**Issues**:
- <List of issues, if any>

**Recommendations**:
- <Actionable improvements>

### 2. Argument Handling (<Grade>)

**Findings**:
- <Specific observations>

**Issues**:
- <List of issues, if any>

**Recommendations**:
- <Actionable improvements>

### 3. Dynamic Features (<Grade>)

**Findings**:
- <Specific observations>

**Issues**:
- <List of issues, if any>

**Recommendations**:
- <Actionable improvements>

### 4. Scope and Structure (<Grade>)

**Findings**:
- <Specific observations>

**Issues**:
- <List of issues, if any>

**Recommendations**:
- <Actionable improvements>

### 5. Skill Boundary (<Grade>)

**Findings**:
- <Specific observations>

**Issues**:
- <List of issues, if any>

**Recommendations**:
- <Actionable improvements, including skill conversion if needed>

### 6. Security & Best Practices (<Grade>)

**Findings**:
- <Specific observations>

**Issues**:
- <List of issues, if any>

**Recommendations**:
- <Actionable improvements>

---

## Priority Improvements

List improvements by priority:

### Critical (Fix Immediately)
- <Security issues, data loss risks>

### High (Fix Soon)
- <Functionality issues, error-prone patterns>

### Medium (Recommended)
- <Best practice violations, optimization opportunities>

### Low (Optional)
- <Style improvements, consistency enhancements>

---

## Improved Version

<If significant improvements are needed, provide a corrected version of the command file>

```markdown
---
<corrected frontmatter>
---

<corrected command body>
```

---

## Examples for Reference

<If applicable, reference similar patterns from references/examples.md>
```

#### Grading Logic

**Overall Grade Determination**:
1. If any dimension is F or multiple D's → Overall is C or below
2. If Security dimension is D or F → Overall is D or F (security is critical)
3. If all dimensions are B or A → Overall is B or A
4. Mixed grades → Weight toward lowest dimension

**Read**: `references/evaluation-criteria.md` (section: "Grade Judgment Guidelines")

### Step 5: Provide Comparative Analysis (Multiple Commands)

When reviewing multiple commands, add a comparative summary:

```markdown
# Multi-Command Review Summary

**Commands Reviewed**: <count>

## Grade Distribution

| Grade | Count | Commands |
|-------|-------|----------|
| A | <n> | <list> |
| B | <n> | <list> |
| C | <n> | <list> |
| D | <n> | <list> |
| F | <n> | <list> |

## Common Issues Across Commands

1. <Most frequent issue>
2. <Second most frequent issue>
3. <Third most frequent issue>

## Best Practices Observed

- <Positive patterns worth highlighting>

## Recommendations for Command Suite

- <Overall suggestions for the command collection>
```

## Reference Materials

This skill includes comprehensive reference documentation. Read these files as needed during the review process:

### references/best-practices.md
- File structure and scope guidelines
- Frontmatter field descriptions and usage
- Dynamic features (argument processing, Bash integration, file references)
- Slash command vs skill decision criteria
- Security best practices
- Good examples of each pattern

**When to read**: Always consult when evaluating specific dimensions or providing improvement recommendations.

### references/evaluation-criteria.md
- Detailed grading criteria for each dimension (A-F)
- Review checklist for systematic evaluation
- Grade judgment guidelines
- Evaluation examples with reasoning

**When to read**: Always consult when assigning grades to ensure consistency and accuracy.

### references/examples.md
- Good examples (Grade A-B) with explanations
- Bad examples (Grade D-F) with problems identified
- Before/after improvement comparisons
- Comparison table of good vs bad practices

**When to read**: When user needs concrete examples or when suggesting improvements similar to established patterns.

## Best Practices for This Review

1. **Always read relevant reference files**: Don't rely on memory alone; consult the reference materials for accurate grading and recommendations.

2. **Be specific and actionable**: Point to exact lines or patterns, provide concrete code examples for improvements.

3. **Prioritize security**: Any security issue (command injection, arbitrary file access) should result in immediate grade reduction and critical priority.

4. **Consider context**: Commands in team repositories may have different requirements than personal commands.

5. **Provide examples**: Use `references/examples.md` to illustrate good patterns and show before/after improvements.

6. **Be constructive**: Focus on how to improve, not just what's wrong. Every recommendation should be actionable.

7. **Respect user intent**: If a command is intentionally simple or minimal, don't penalize for missing optional features.

8. **Suggest skill conversion carefully**: Only recommend converting to a skill when complexity genuinely warrants it, not just for minor improvements.

## Output Format

- Present findings clearly with markdown formatting
- Use tables for dimension grades and priority lists
- Include code blocks for examples and improvements
- Use emojis sparingly for status indicators (✅ ⚠️ ❌)
- Keep technical language clear but accessible
- Structure report for easy scanning and reference
