---
name: subagent-review
description: Review sub-agent implementations against Claude Code best practices. Use this skill when evaluating or auditing sub-agent configurations, system prompts, tool permissions, or overall architecture to ensure they follow recommended patterns for focus, security, and effectiveness. Applies when the user mentions "sub-agent review", "agent audit", "validate agent", "check agent configuration", or needs to assess agent quality before deployment.
---

# Sub-agent Reviewer

## Overview

Review and evaluate sub-agent implementations to ensure they follow Claude Code's best practices for sub-agent design. Provide actionable recommendations for improving sub-agent focus, security, and effectiveness.

## Review Criteria

### 1. Single Responsibility Principle

**Guideline:** Design focused sub-agents with single, clear responsibilities rather than multifunctional ones.

**Review questions:**
- Does the sub-agent have one clearly defined purpose?
- Can the purpose be stated in a single sentence?
- Are there multiple unrelated tasks combined in one sub-agent?
- Would splitting the sub-agent improve clarity or performance?

**Red flags:**
- Sub-agent descriptions containing "and" or "or" listing multiple unrelated capabilities
- Generic names like "helper" or "utility" without specific focus
- System prompts covering vastly different domains or workflows

**Recommendations:**
- Split multi-purpose sub-agents into focused, specialized ones
- Ensure each sub-agent answers: "What is the ONE thing this agent does?"
- Prefer multiple narrow sub-agents over one broad sub-agent

### 2. System Prompt Quality

**Guideline:** Include specific instructions, examples, and constraints in system prompts.

**Review questions:**
- Does the system prompt include specific, actionable instructions?
- Are there concrete examples demonstrating expected behavior?
- Are constraints and limitations clearly stated?
- Is the prompt detailed enough to guide consistent behavior?

**Red flags:**
- Vague instructions like "help with coding" without specifics
- Missing examples or use cases
- No constraints on scope or behavior
- Overly short prompts (<100 words for complex tasks)

**Recommendations:**
- Add step-by-step procedures for common workflows
- Include 2-3 concrete examples of input/output
- Define clear boundaries (what the agent should NOT do)
- Specify expected output format and quality standards

### 3. Tool Access Restrictions

**Guideline:** Only grant tools that are necessary for the sub-agent's purpose.

**Review questions:**
- Does every granted tool directly support the sub-agent's core purpose?
- Are there tools granted "just in case" that aren't essential?
- Could removing tools improve focus or security?
- Are high-privilege tools (Bash, Write, Edit) justified?

**Red flags:**
- All tools granted without justification
- Bash access for agents that don't need system operations
- Write/Edit access when Read-only would suffice
- File operation tools for agents focused on analysis/reporting

**Recommendations:**
- List required tools explicitly with justification
- Default to minimal tool set, adding only when proven necessary
- Consider read-only alternatives (Read vs Edit, Grep vs Bash)
- Document why each tool is necessary in configuration

### 4. Version Control Integration

**Guideline:** Commit project-level sub-agents to repository for team collaboration.

**Review questions:**
- Are project-specific sub-agents in version control?
- Is there a clear location for sub-agent configurations (.claude/)?
- Can team members discover and use shared sub-agents?
- Is there documentation on available sub-agents?

**Red flags:**
- Sub-agent configs only on individual machines
- No standardized location in repository
- Undocumented custom sub-agents
- Different team members using conflicting sub-agent versions

**Recommendations:**
- Store sub-agents in `.claude/subagents/` or similar
- Add README documenting available sub-agents and usage
- Include in code review process for changes
- Maintain changelog for sub-agent updates

### 5. Appropriate Foundation

**Guideline:** Start with Claude-generated agents and customize them for specific needs.

**Review questions:**
- Was the sub-agent based on a Claude-generated template?
- If built from scratch, is there a clear reason why?
- Does the implementation follow patterns from official examples?
- Are custom additions well-justified?

**Red flags:**
- Complex sub-agents built entirely from scratch
- Implementations that deviate from recommended patterns without reason
- Missing features that standard templates include
- Reinventing capabilities already in generated agents

**Recommendations:**
- Start with Claude Code's built-in agent generation
- Document customizations and their rationale
- Reference official examples when creating new patterns
- Consider whether existing sub-agent types can be extended

## Review Process

When reviewing sub-agent implementations, follow this process:

### 1. Read configuration files

**Action**: Load sub-agent definitions, system prompts, and tool lists

**Verification**:
- Verify that all required files exist (configuration JSON, system prompt if separate)
- Confirm files are readable and properly formatted
- Check for valid JSON syntax in configuration

**Error Handling**:
- If configuration file not found:
  1. Check common locations: `.claude/subagents/`, `./subagents/`, `./.claude/`
  2. List files in these directories to help user locate the configuration
  3. Report specific missing file with full path
  4. Suggest checking repository documentation
- If JSON is invalid:
  1. Report specific syntax error and line number if possible
  2. Suggest using a JSON validator
  3. Provide example of correct format

### 2. Evaluate against each criterion

**Action**: Go through the 5 review criteria systematically

**Verification**:
- Ensure each criterion has been evaluated with specific findings
- Confirm observations are backed by concrete examples from the configuration
- Verify all 5 criteria have been addressed

**Error Handling**:
- If a criterion cannot be evaluated due to missing information:
  1. Note it as a separate issue in the findings
  2. Explain what information is missing
  3. Suggest how to provide the missing information

### 3. Document findings

**Action**: Note strengths and areas for improvement

**Verification**:
- Confirm all findings have specific examples from the configuration
- Ensure both strengths and weaknesses are documented
- Verify findings are categorized by the 5 criteria

**Error Handling**: N/A

### 4. Prioritize recommendations

**Action**: Rank issues by impact (security > focus > optimization)

**Verification**:
- Ensure priority assignments are consistent with impact assessment
- Confirm security issues are marked as highest priority
- Verify each recommendation has a clear priority level

**Error Handling**: N/A

### 5. Provide actionable guidance

**Action**: Suggest specific changes with examples

**Verification**:
- Verify each recommendation includes a concrete before/after example
- Ensure guidance is specific and actionable
- Confirm examples are relevant to the sub-agent's context

**Error Handling**:
- If examples cannot be generated:
  1. Provide reference to similar patterns in `references/examples.md`
  2. Explain the principle behind the recommendation
  3. Suggest consulting best practices documentation

## Output Format

The review can be presented in two formats, depending on the context:

### Standard Format (Detailed Review)

Use this format for comprehensive audits or formal reviews:

#### Sub-agent: [Name]

**Purpose:** [One-sentence description of intended purpose]

**Overall Assessment:** [Brief summary of adherence to best practices]

**Detailed Findings:**

##### 1. Single Responsibility
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

##### 2. System Prompt Quality
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

##### 3. Tool Access
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

##### 4. Version Control
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

##### 5. Foundation
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

**Priority Recommendations:**
1. [Highest priority improvement]
2. [Second priority improvement]
3. [Additional recommendations]

### Quick Assessment Format (Rapid Review)

Use this format for quick checks or pre-commit validation:

**Sub-agent**: [Name]

**Overall**: [✅ Ready / ⚠️ Needs Minor Fixes / ❌ Major Issues]

**Brief Assessment**: [One-sentence summary of overall quality]

**Top 3 Issues**:
1. [Issue 1 with priority indicator]
2. [Issue 2 with priority indicator]
3. [Issue 3 with priority indicator]

**Recommended Action**: [Most critical next step]

## Reference Material

For detailed best practices and examples, consult:
- `references/best_practices.md` - Complete best practices documentation
- `references/examples.md` - Example sub-agent configurations

## Usage Examples

### Example 1: Reviewing a single sub-agent

**Input:**
```
User: "Review my code-formatter sub-agent configuration"
```

**Process:**
1. Load `.claude/subagents/code-formatter.json`
2. Read system prompt
3. Evaluate against 5 criteria
4. Generate findings with specific examples

**Output:**
```markdown
#### Sub-agent: code-formatter

**Purpose:** Format code files according to team style guidelines

**Overall Assessment:** ⚠️ Good foundation with minor improvements needed

**Detailed Findings:**

##### 1. Single Responsibility ✅ Excellent
- Clear focus on code formatting only
- Purpose stated in one sentence
- No unrelated capabilities

##### 2. System Prompt Quality ⚠️ Needs Improvement
- Instructions present but could be more specific
- Missing: Concrete before/after examples
- Missing: Edge case handling (e.g., malformed code)
- Recommendation: Add 2-3 formatting transformation examples

##### 3. Tool Access ✅ Excellent
- Tools: Read, Edit (appropriate for formatting)
- No unnecessary high-privilege tools
- Well justified for the task

##### 4. Version Control ✅ Excellent
- Configuration in `.claude/subagents/`
- Version: 1.2.0
- Documented in `.claude/README.md`

##### 5. Foundation ⚠️ Needs Improvement
- Based on custom implementation
- Recommendation: Document why standard template wasn't used

**Priority Recommendations:**
1. 🟠 Add 2-3 concrete formatting examples to system prompt
2. 🟡 Document edge case handling
3. 🟢 Consider adding validation step in workflow
```

### Example 2: Quick assessment before commit

**Input:**
```
User: "Quick check - is my new test-runner agent ready to commit?"
```

**Output (Quick Assessment Format):**
```markdown
**Sub-agent**: test-runner

**Overall**: ⚠️ Needs Minor Fixes

**Brief Assessment**: Solid implementation with 2 minor issues before committing

**Top 3 Issues**:
1. 🟡 Add version field to configuration (best practice for team tracking)
2. 🟡 Document agent in `.claude/README.md` for team discoverability
3. 🟢 System prompt could benefit from error handling examples

**Recommended Action**: Add version field and README entry, then ready to commit
```

### Example 3: Auditing all project sub-agents

**Input:**
```
User: "Audit all sub-agents in .claude/subagents/"
```

**Output:**
```markdown
# Sub-agent Audit Report

**Total agents reviewed**: 3
**Overall health**: ⚠️ Good with recommended improvements

## Summary by Agent

1. **code-reviewer** - ✅ Excellent (no issues)
2. **test-generator** - ⚠️ Needs improvement (2 medium priority issues)
3. **doc-writer** - ❌ Major issues (1 critical, 2 high priority issues)

## Priority Actions

### Critical (Immediate)
- **doc-writer**: Remove unnecessary Bash and KillShell tools (security risk)

### High Priority (This Week)
- **test-generator**: Add concrete examples to system prompt
- **doc-writer**: Split into focused agents (currently handles 3 unrelated tasks)

### Medium Priority (This Month)
- **test-generator**: Add version control documentation
- **doc-writer**: After splitting, add proper examples to each new agent

[Detailed findings for each agent follow...]
```
