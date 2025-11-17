---
name: skills-review
description: Comprehensively review Claude Code skills against best practices, evaluating quality, structure, discoverability, and efficiency across six dimensions (description, progressive disclosure, content quality, workflow, templates, technical details). Provides A-F grades with specific improvement recommendations. Use when users request "skill review," "check skill quality," "validate best practices," "skill assessment," "improve skill," or mention skill evaluation, quality check, or standards compliance.
allowed-tools: [Read, Glob, Grep, TodoWrite]
---

## Table of Contents

1. [Purpose](#purpose)
2. [When to Use This Skill](#when-to-use-this-skill)
3. [Review Dimensions](#review-dimensions)
4. [Review Process](#review-process)
   - [Step 1: Load Skill Files](#step-1-load-skill-files)
   - [Step 2: Evaluate Against Best Practices](#step-2-evaluate-against-best-practices)
   - [Step 3: Classify Issues by Priority](#step-3-classify-issues-by-priority)
   - [Step 4: Generate Review Report](#step-4-generate-review-report)
   - [Step 5: Provide Concrete Examples](#step-5-provide-concrete-examples)
   - [Step 6: Continuous Improvement Cycle](#step-6-continuous-improvement-cycle)
5. [Default Settings](#default-settings)
6. [Grading Criteria](#grading-criteria)
7. [Important Notes](#important-notes)

---

## Purpose

Review Claude Code skills systematically against best practices to ensure quality, discoverability, and optimal performance. Evaluate skills across seven key dimensions and provide actionable improvement recommendations.

## When to Use This Skill

Use this skill when:
- Validating a new skill before distribution
- Improving an existing skill's quality
- Ensuring compliance with Claude Code skill best practices
- Diagnosing discoverability or performance issues
- Learning what makes an effective skill

## Review Dimensions

This skill evaluates skills across six dimensions:

1. **Description Quality**: Third-person, specific functionality, trigger words, optimal length
2. **Progressive Disclosure**: SKILL.md ≤500 lines, external references, single-layer depth
3. **Content Quality**: Conciseness, time-independence, terminology consistency
4. **Workflow**: Clear steps, validation points, error handling
5. **Templates & Examples**: Output templates, good/bad examples
6. **Technical Details**: Scripts, MCP tool references, dependencies

## Review Process

### Step 1: Load Skill Files

Load the target skill's files:
- SKILL.md (required)
- Related reference files (if present)

**Verification**: Verify that SKILL.md exists and has valid YAML frontmatter.

**Error Handling**:

If SKILL.md is not found:
1. Check common alternative paths:
   - `./SKILL.md` (current directory)
   - `./[skill-name]/SKILL.md` (skill directory)
   - `./skills/[skill-name]/SKILL.md` (nested structure)
2. If still not found, report error with searched paths
3. Suggest user to verify the skill directory path

If YAML frontmatter is invalid:
1. Check for missing `---` delimiters
2. Verify required fields exist (`name`, `description`)
3. Check for YAML syntax errors (indentation, special characters)
4. Provide specific error message with line number if possible

If reference files are missing:
1. Note missing files in review report
2. Continue review with available files
3. Flag as Medium priority issue in final report

### Step 2: Evaluate Against Best Practices

Systematically evaluate the skill using the comprehensive checklist in `CHECKLIST.md`. This checklist covers all six review dimensions with specific criteria and scoring.

Key evaluation points:
- **Description**: Third-person, trigger words, 200-800 characters optimal
- **Structure**: SKILL.md ≤500 lines, single-layer references
- **Content**: Concise, time-independent, consistent terminology
- **Workflow**: Clear steps with validation and error handling
- **Templates**: Provided for expected outputs
- **Technical**: Scripts, MCP references, dependencies

For detailed evaluation criteria, refer to `CHECKLIST.md`.

### Step 3: Classify Issues by Priority

Classify detected issues:

- 🔴 **Critical**: Skill won't function (missing required fields, structural errors)
- 🟠 **High**: Significantly impacts quality (naming violations, poor description)
- 🟡 **Medium**: Recommended improvements (line count, time-dependent info)
- 🟢 **Low**: Optimizations (better structure, additional examples)

### Step 4: Generate Review Report

Create a comprehensive review report using the template in `REPORT_TEMPLATE.md`.

Required sections:
- Executive summary with overall score (A-F grade)
- Priority-based improvement recommendations
- Specific fix examples (before/after)
- Best practice compliance status
- Recommended next actions

### Step 5: Provide Concrete Examples

For each issue, provide before/after examples showing the recommended fix. Reference `EXAMPLES.md` for common patterns and anti-patterns.

### Step 6: Continuous Improvement Cycle

After implementing recommended improvements, re-review the skill to verify changes and identify any remaining issues.

**Workflow**:

1. **Implement Changes**: Apply high and medium priority improvements first
2. **Verify Changes**: Ensure each change addresses the identified issue
3. **Re-Review**: Run the review process again on the updated skill
4. **Compare Scores**: Track improvement from initial to post-improvement score
5. **Iterate**: Continue until achieving target grade (typically B or higher)

**Success Criteria**:

- All Critical and High priority issues resolved
- Grade improved by at least one level (e.g., C → B)
- No new issues introduced by changes
- Documentation updated to reflect improvements

**Validation Points**:

- SKILL.md still within 500-line recommendation
- All internal references still valid
- YAML frontmatter remains valid
- Description still within 1024 character limit

This feedback loop ensures continuous quality improvement and validates that changes have the intended effect.

## Default Settings

### Evaluation Criteria
- **Description**: Require trigger words ("Use when...")
- **Line Count**: Recommend SKILL.md ≤500 lines, warn if exceeded
- **Reference Depth**: Recommend single layer, warn if deeper

### Output Format
- **Report Format**: Detailed Markdown report following `REPORT_TEMPLATE.md`
- **Grading Scale**: A (Excellent) / B (Good) / C (Needs Improvement) / D (Many Issues) / F (Fail)
- **Priority Levels**: 4 tiers (Critical/High/Medium/Low)

### Analysis Approach
- **Rigor**: Strictly apply best practices
- **Pragmatism**: Consider project-specific requirements when appropriate
- **Constructiveness**: Provide specific, actionable improvements, not just criticism

## Grading Criteria

### A (Excellent: 90-100 points)
- Fully compliant with all best practices
- Progressive disclosure properly implemented
- Highly discoverable description
- Clear workflow with validation

### B (Good: 70-89 points)
- Compliant with most best practices
- Minor improvements possible
- Solid foundation

### C (Needs Improvement: 50-69 points)
- Several important issues
- Multiple best practice violations
- Significant improvement potential

### D (Many Issues: 30-49 points)
- Numerous best practice violations
- Structural problems
- Major revision needed

### F (Fail: 0-29 points)
- Critical issues present
- Doesn't meet basic requirements
- Complete redesign recommended

## Important Notes

1. Clearly specify the skill directory path for review
2. Report error if SKILL.md doesn't exist
3. Apply best practices rigorously while considering project-specific context
4. Provide specific, actionable improvement recommendations
5. Always include before/after comparison examples

This systematic review process ensures objective skill quality assessment and supports continuous improvement.
