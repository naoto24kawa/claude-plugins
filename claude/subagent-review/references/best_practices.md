# Sub-agent Best Practices - Complete Reference

This document provides comprehensive guidance on Claude Code sub-agent best practices, derived from official documentation at https://code.claude.com/docs/en/sub-agents.

## What Are Sub-agents?

Sub-agents are specialized AI assistants with distinct capabilities. Each sub-agent operates independently with its own context window separate from the main conversation and can be configured with specific tools and custom system prompts guiding their behavior.

## How Sub-agents Work

Sub-agents function through intelligent delegation:
- Claude Code automatically identifies when a task matches a sub-agent's expertise
- The specialized agent works independently and returns results
- They maintain separate context, preventing pollution of main conversations
- Each has distinct permissions for which tools it can access

## Key Advantages

1. **Context Preservation** - Each sub-agent operates in its own context, preventing pollution of the main conversation

2. **Specialized Expertise** - Custom configurations enable higher success rates on designated tasks

3. **Reusability** - Once created, sub-agents function across projects and teams

4. **Flexible Permissions** - Different tool access levels for security and focus

## Best Practice 1: Start with Claude-Generated Agents

**Guideline:** "Start with Claude-generated agents" and customize them for your needs.

**Why it matters:**
- Provides a solid baseline configuration
- Incorporates proven patterns and structure
- Reduces implementation errors
- Enables faster iteration

**Implementation:**
- Use Claude Code's built-in agent generation features
- Begin with templates that match your use case
- Document customizations made to generated agents
- Keep track of deviations from baseline for future reference

**Anti-patterns:**
- Building complex sub-agents entirely from scratch
- Ignoring available templates and examples
- Not documenting why custom implementations were necessary

## Best Practice 2: Design Focused Sub-agents

**Guideline:** Build sub-agents with singular, well-defined purposes rather than attempting to consolidate multiple responsibilities.

**Why it matters:**
- Specialization enhances predictability
- Improves performance outcomes
- Makes sub-agents easier to maintain
- Reduces confusion about when to use each agent

**Implementation:**
- Each sub-agent should do ONE thing well
- The purpose should be stateable in a single sentence
- Avoid combining unrelated capabilities
- Prefer multiple narrow sub-agents over one broad sub-agent

**Questions to ask:**
- Can I describe this sub-agent's purpose in one sentence?
- Are there multiple unrelated tasks being handled?
- Would splitting this improve clarity?
- Does the name clearly indicate the single responsibility?

**Anti-patterns:**
- Sub-agents with "and" or "or" in their purpose description
- Generic names like "helper" or "utility"
- Combining data analysis AND file manipulation AND API calls
- System prompts that cover vastly different domains

**Good examples:**
- "Format code according to team style guide"
- "Extract structured data from PDF invoices"
- "Generate API documentation from code comments"

**Bad examples:**
- "Help with coding tasks and documentation"
- "Process files and make API calls"
- "General purpose utility agent"

## Best Practice 3: Write Detailed System Prompts

**Guideline:** "Include specific instructions, examples, and constraints in your system prompts."

**Why it matters:**
- Comprehensive guidance enables effective operation
- Examples demonstrate expected behavior
- Constraints prevent scope creep
- Detailed prompts improve reliability and consistency

**Implementation:**

### Include Specific Instructions
- Provide step-by-step procedures for workflows
- Define expected behavior in different scenarios
- Specify how to handle edge cases
- Include decision trees for complex processes

### Provide Concrete Examples
- Include 2-3 examples of typical inputs
- Show expected outputs for each example
- Demonstrate both simple and complex cases
- Cover common variations

### Define Clear Constraints
- State what the sub-agent should NOT do
- Define scope boundaries explicitly
- Specify when to escalate to main conversation
- List assumptions and preconditions

### Quality Standards
- Specify expected output format
- Define quality criteria
- Include validation steps
- Set performance expectations

**Anti-patterns:**
- Vague instructions like "help with coding"
- No examples provided
- Omitting constraints on scope
- Overly short prompts for complex tasks (<100 words)

**Prompt structure template:**
```markdown
# [Sub-agent Name]

## Purpose
[One sentence describing the singular focus]

## Instructions
1. [Step-by-step procedure]
2. [Include decision points]
3. [Handle edge cases]

## Examples

### Example 1: [Scenario]
Input: [Sample input]
Output: [Expected output]

### Example 2: [Different scenario]
Input: [Sample input]
Output: [Expected output]

## Constraints
- DO: [Permitted actions]
- DO NOT: [Prohibited actions]
- When to escalate: [Conditions requiring human input]

## Output Requirements
- Format: [Expected structure]
- Quality: [Standards to meet]
- Validation: [Checks to perform]
```

## Best Practice 4: Limit Tool Access

**Guideline:** "Only grant tools that are necessary for the sub-agent's purpose."

**Why it matters:**
- Enhances security posture
- Helps agents maintain focus
- Prevents unintended operations
- Reduces complexity
- Makes behavior more predictable

**Implementation:**

### Tool Selection Process
1. List the sub-agent's core operations
2. Identify minimum required tools
3. Justify each tool's inclusion
4. Consider read-only alternatives
5. Document tool permissions

### Tool Categories by Risk

**High-privilege tools (use sparingly):**
- `Bash` - System command execution
- `Write` - File creation
- `Edit` - File modification
- `KillShell` - Process termination

**Medium-privilege tools:**
- `Glob` - File pattern matching
- `Grep` - Code search
- `WebFetch` - External content retrieval

**Low-privilege tools:**
- `Read` - File reading (read-only)
- `TodoWrite` - Task management
- `AskUserQuestion` - User interaction

### Decision Matrix

| Sub-agent Focus | Likely Needs | Probably Doesn't Need |
|----------------|--------------|----------------------|
| Code Review | Read, Grep, Glob | Write, Edit, Bash |
| File Formatting | Read, Edit | Bash, WebFetch, KillShell |
| Documentation | Read, Write, Glob | Bash, Edit, KillShell |
| Data Analysis | Read, Bash (for data tools) | Write, Edit |
| Research | Read, WebFetch, Grep | Write, Edit, Bash |

**Anti-patterns:**
- Granting all tools by default
- "Just in case" tool permissions
- Write access when Read would suffice
- Bash access for purely analytical agents
- No justification for tool selections

## Best Practice 5: Version Control Integration

**Guideline:** Commit project-level sub-agents to your repository so team members can collectively enhance and benefit from shared, standardized workflows.

**Why it matters:**
- Enables team collaboration
- Provides standardized workflows
- Facilitates knowledge sharing
- Supports collective improvement
- Ensures consistency across team

**Implementation:**

### Directory Structure
```
.claude/
├── subagents/
│   ├── code-reviewer.json
│   ├── test-generator.json
│   └── api-documenter.json
└── README.md
```

### Configuration Format
```json
{
  "name": "code-reviewer",
  "description": "Review code changes for best practices and potential issues",
  "systemPrompt": "...",
  "tools": ["Read", "Grep", "Glob"],
  "version": "1.0.0",
  "author": "Team Name",
  "lastUpdated": "2025-01-15"
}
```

### Documentation Requirements
Create `.claude/README.md` with:
- List of available sub-agents
- Purpose of each sub-agent
- When to use each agent
- Example invocations
- Customization guidelines

### Maintenance Practices
- Include sub-agent changes in code reviews
- Maintain changelog for updates
- Version sub-agent configurations
- Document breaking changes
- Test sub-agents before committing

**Anti-patterns:**
- Sub-agent configs only on individual machines
- No standardized repository location
- Undocumented custom sub-agents
- Different versions across team members
- No review process for sub-agent changes

## Usage Methods

### Automatic Invocation
Claude Code proactively delegates based on:
- Task description matching sub-agent purpose
- File types being processed
- Keywords in user requests
- Context of current conversation

### Explicit Invocation
Users can request specific sub-agents:
- "Use the code-reviewer sub-agent to check my changes"
- "Run the test-generator agent on this file"
- "Apply the documentation formatter to these files"

## Advanced Patterns

### Chaining Sub-agents
For complex workflows, sub-agents can be used in sequence:
1. Code generator creates initial implementation
2. Code reviewer evaluates and suggests improvements
3. Test generator creates test suite
4. Documentation agent creates API docs

### Specialized vs. General
Balance specialization with practicality:
- **Too specialized:** Separate sub-agents for Python formatting, JavaScript formatting, TypeScript formatting
- **Well-balanced:** Code formatter with language-specific configurations
- **Too general:** Generic "helper" agent for all tasks

### Context Window Management
Sub-agents help manage context by:
- Operating in isolated contexts
- Preventing main conversation pollution
- Enabling focused, deep work on specific tasks
- Returning only essential results to main conversation

## Common Pitfalls

1. **Over-engineering:** Creating sub-agents for trivial tasks
2. **Under-specification:** Vague system prompts without examples
3. **Permission bloat:** Granting unnecessary tool access
4. **Poor naming:** Generic names that don't indicate purpose
5. **No documentation:** Team members can't discover available agents
6. **Scope creep:** Sub-agents that grow to handle too many tasks
7. **Neglected maintenance:** Outdated sub-agents with stale practices

## Validation Checklist

Before deploying a sub-agent, verify:

- [ ] Purpose is clearly defined in one sentence
- [ ] System prompt includes specific instructions
- [ ] System prompt provides 2+ concrete examples
- [ ] Constraints and boundaries are explicit
- [ ] Tools granted are minimal and justified
- [ ] Configuration is in version control
- [ ] Documentation exists for team members
- [ ] Name clearly indicates purpose
- [ ] Based on or informed by Claude-generated template
- [ ] Tested with realistic scenarios

## Conclusion

Following these best practices ensures sub-agents are:
- **Focused:** Clear, singular purpose
- **Reliable:** Detailed prompts with examples
- **Secure:** Minimal, justified tool access
- **Collaborative:** Version controlled and documented
- **Effective:** Built on proven foundations

Regular review and iteration of sub-agents based on real-world usage helps maintain their quality and relevance over time.
