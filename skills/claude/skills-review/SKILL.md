---
name: skills-review
description: Comprehensively review Claude Code skills against best practices, evaluating quality, structure, discoverability, and efficiency across seven dimensions (naming, description, progressive disclosure, content quality, workflow, templates, technical details). Provides A-F grades with specific improvement recommendations. Use when users request "skill review," "check skill quality," "validate best practices," "skill assessment," "improve skill," or mention skill evaluation, quality check, or standards compliance.
allowed-tools: [Read, Glob, Grep, TodoWrite]
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

This skill evaluates skills across seven dimensions:

1. **Naming Convention**: Gerund form, lowercase, hyphen-separated
2. **Description Quality**: Third-person, specific functionality, trigger words, optimal length
3. **Progressive Disclosure**: SKILL.md ≤500 lines, external references, single-layer depth
4. **Content Quality**: Conciseness, time-independence, terminology consistency
5. **Workflow**: Clear steps, validation points, error handling
6. **Templates & Examples**: Output templates, good/bad examples
7. **Technical Details**: Scripts, MCP tool references, dependencies

## Review Process

### Step 1: Load Skill Files

Load the target skill's files:
- SKILL.md (required)
- Related reference files (if present)

Verify that SKILL.md exists and has valid YAML frontmatter.

### Step 2: Evaluate Against Best Practices

Systematically evaluate the skill using the comprehensive checklist in `CHECKLIST.md`. This checklist covers all seven review dimensions with specific criteria and scoring.

Key evaluation points:
- **Naming**: Gerund form, lowercase, meaningful
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

## Default Settings

### Evaluation Criteria
- **Naming**: Strongly recommend gerund form (verb+-ing)
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
