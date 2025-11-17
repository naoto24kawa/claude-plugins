---
name: subagent-review
description: Review sub-agent implementations against Claude Code best practices. Use this skill when evaluating or auditing sub-agent configurations, system prompts, tool permissions, or overall architecture to ensure they follow recommended patterns for focus, security, and effectiveness.
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

1. **Read configuration files** - Load sub-agent definitions, system prompts, and tool lists
2. **Evaluate against each criterion** - Go through the 5 review criteria systematically
3. **Document findings** - Note strengths and areas for improvement
4. **Prioritize recommendations** - Rank issues by impact (security > focus > optimization)
5. **Provide actionable guidance** - Suggest specific changes with examples

## Output Format

Structure review findings as:

### Sub-agent: [Name]

**Purpose:** [One-sentence description of intended purpose]

**Overall Assessment:** [Brief summary of adherence to best practices]

**Detailed Findings:**

#### 1. Single Responsibility
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

#### 2. System Prompt Quality
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

#### 3. Tool Access
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

#### 4. Version Control
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

#### 5. Foundation
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [Specific observations]
- [Recommendations if applicable]

**Priority Recommendations:**
1. [Highest priority improvement]
2. [Second priority improvement]
3. [Additional recommendations]

## Reference Material

For detailed best practices and examples, consult:
- `references/best_practices.md` - Complete best practices documentation
- `references/examples.md` - Example sub-agent configurations

## Usage Examples

**Example 1:** Reviewing a single sub-agent
```
User: "Review my code-formatter sub-agent configuration"
Assistant: [Loads configuration, evaluates against 5 criteria, provides structured review]
```

**Example 2:** Auditing all project sub-agents
```
User: "Audit all sub-agents in .claude/subagents/"
Assistant: [Reviews each sub-agent, provides summary report with prioritized improvements]
```

**Example 3:** Pre-deployment validation
```
User: "Validate this sub-agent before we commit it to the repo"
Assistant: [Thorough review focusing on version control readiness and team usability]
```
