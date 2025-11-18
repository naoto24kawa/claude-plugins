---
name: mcp-review
description: Validate and review MCP (Model Context Protocol) server configurations in .mcp.json files against best practices. Evaluate security, scope management, environment variable usage, transport types, and common pitfalls. Provide actionable recommendations for configuration improvements. Use when users request "MCP configuration review," "validate .mcp.json," "check MCP setup," "MCP best practices," or mention MCP server configuration, security review, or troubleshooting MCP issues.
allowed-tools: [Read, Glob, Grep, TodoWrite]
---

## Table of Contents

1. [Purpose](#purpose)
2. [When to Use This Skill](#when-to-use-this-skill)
3. [Validation Dimensions](#validation-dimensions)
4. [Validation Process](#validation-process)
5. [Configuration Creation Support](#configuration-creation-support)
6. [Important Notes](#important-notes)

---

## Purpose

Validate and review MCP server configurations to ensure security, proper scope management, and adherence to Claude Code best practices. Provide actionable guidance for creating and improving .mcp.json configurations.

## When to Use This Skill

Use this skill when:
- Reviewing existing .mcp.json configurations
- Creating new MCP server configurations
- Troubleshooting MCP connection or authentication issues
- Ensuring security best practices are followed
- Validating environment variable usage
- Checking transport type appropriateness

## Validation Dimensions

This skill evaluates MCP configurations across seven dimensions:

1. **File Structure**: Valid JSON, proper mcpServers object, correct schema
2. **Security**: No hardcoded secrets, proper environment variable usage, secure headers
3. **Scope Management**: Appropriate scope choice (local/project/user)
4. **Transport Type**: Correct transport for use case (stdio/http/sse)
5. **Server Configuration**: Command/args validity, URL format, headers
6. **Environment Variables**: Proper ${VAR} syntax, fallback values ${VAR:-default}
7. **Common Pitfalls**: Windows cmd /c wrapper, executable paths, OAuth setup

## Validation Process

### Step 1: Locate Configuration Files

Search for MCP configuration files in the project:

```bash
# Common locations for .mcp.json files
- Project root: ./.mcp.json
- Skill directories: ./skills/*/.mcp.json
- Nested structures: ./skills/*/**/.mcp.json
```

**Verification**: Confirm that at least one .mcp.json file exists.

**Error Handling**:
- If no files found, offer to create a new configuration
- If multiple files found, ask which to review or review all

### Step 2: Parse and Validate Structure

Load and parse the JSON configuration:

1. Verify valid JSON syntax
2. Check for required `mcpServers` object
3. Validate server entries structure
4. Check transport-specific requirements

**Verification**: Confirm JSON is valid and follows MCP schema.

**Error Handling**:
- Report JSON syntax errors with line numbers
- Identify missing required fields
- Flag unknown or deprecated fields

### Step 3: Security Review

Evaluate security aspects using the checklist in `references/security-checklist.md`:

**Critical checks**:
- ✅ No hardcoded API keys or tokens
- ✅ Secrets use environment variables (${VAR} syntax)
- ✅ OAuth tokens not in configuration
- ✅ Secure headers properly formatted
- ✅ URLs use HTTPS where appropriate

**Verification**: All sensitive data uses environment variables.

**Error Handling**:
- Flag any hardcoded secrets as CRITICAL
- Suggest environment variable alternatives
- Recommend proper secret management

### Step 4: Validate Transport Configuration

Check transport type appropriateness:

**stdio (local processes)**:
- Used for: Local scripts, npx packages, uvx packages
- Command must be executable (node, python, npx, uvx, etc.)
- Args array properly formatted
- Windows: Check for cmd /c wrapper if needed

**http (cloud services)**:
- Used for: Remote APIs, cloud MCP servers
- URL must be valid HTTPS endpoint
- Headers properly configured
- OAuth setup if required

**sse (deprecated)**:
- Flag with warning: HTTP transport preferred
- Provide migration guidance if possible

**Verification**: Transport type matches use case.

**Error Handling**:
- Warn about sse deprecation
- Suggest http alternative for sse servers
- Validate command executability for stdio

### Step 5: Environment Variable Review

Check environment variable usage:

1. Verify proper syntax: `${VAR}` or `${VAR:-default}`
2. Document required environment variables
3. Check for sensible default values
4. Validate variable references in:
   - Server URLs
   - Command arguments
   - Headers

**Verification**: All variables use correct syntax and have documentation.

**Error Handling**:
- Flag incorrect variable syntax
- Recommend adding defaults where appropriate
- Create list of required environment variables

### Step 6: Common Pitfalls Check

Review configuration against known issues from `references/common-pitfalls.md`:

- **Windows compatibility**: cmd /c wrapper for npx
- **Executable paths**: Full paths vs. PATH resolution
- **OAuth setup**: Missing authentication step
- **Scope conflicts**: Project settings not approved
- **Output limits**: Large data handling considerations

**Verification**: Configuration avoids common mistakes.

**Error Handling**:
- Provide specific fix for each detected pitfall
- Link to relevant documentation
- Suggest preventive measures

### Step 7: Generate Validation Report

Create comprehensive report using template from `references/report-template.md`:

**Report structure**:
1. **Overview**: Configuration summary, scope, server count
2. **Findings by Priority**:
   - 🔴 Critical: Security issues, invalid configuration
   - 🟠 High: Transport type issues, missing requirements
   - 🟡 Medium: Best practice improvements
   - 🟢 Low: Optional optimizations
3. **Security Assessment**: Detailed security evaluation
4. **Configuration Recommendations**: Specific improvements
5. **Environment Variables**: Required variables list
6. **Next Steps**: Action items prioritized

**Verification**: Report is clear, actionable, and prioritized.

## Configuration Creation Support

When creating new MCP configurations, guide through:

### Step 1: Determine Server Type

Ask user about the MCP server:
- Is it a cloud service (http) or local process (stdio)?
- What is the server package or URL?
- Are there authentication requirements?

### Step 2: Choose Scope

Recommend scope based on use case:
- **project**: Team collaboration, version controlled
- **local**: Personal settings, secrets
- **user**: Cross-project tools

### Step 3: Generate Configuration

Create .mcp.json with appropriate structure:

**For stdio servers**:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name@latest"]
    }
  }
}
```

**For http servers**:
```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### Step 4: Document Requirements

Provide setup instructions:
1. Required environment variables
2. Installation commands (if any)
3. Authentication steps (if OAuth)
4. Testing commands

## Common Patterns

### Security: Secrets Management

**❌ Avoid - Hardcoded secret:**
```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer sk_live_abc123xyz789"
      }
    }
  }
}
```

**✅ Recommended - Environment variable:**
```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### Scope: Project vs Local

**❌ Avoid - Personal credentials in project scope:**
```json
// .mcp.json (version controlled)
{
  "mcpServers": {
    "personal-api": {
      "headers": {
        "Authorization": "Bearer ${MY_PERSONAL_KEY}"
      }
    }
  }
}
```

**✅ Recommended - Use local scope for personal credentials:**
```bash
# Add to local scope instead
claude mcp add --transport http personal-api --scope local \
  --env MY_PERSONAL_KEY=actual_key \
  https://api.example.com/mcp
```

## Important Notes

- **Security First**: Never commit .mcp.json with hardcoded secrets
- **Scope Awareness**: Project scope requires team approval; use local for secrets
- **Environment Variables**: Always use ${VAR} syntax for sensitive data
- **Windows Compatibility**: Add cmd /c for npx on native Windows
- **OAuth Setup**: Requires /mcp command in Claude Code for authentication
- **Testing**: Use /mcp command to verify server connection after configuration
- **Documentation**: Refer to references/best-practices.md for detailed guidance

## Resources

This skill includes reference documentation for comprehensive validation:

### references/

- **best-practices.md**: MCP configuration best practices and patterns
- **security-checklist.md**: Security evaluation criteria
- **common-pitfalls.md**: Known issues and solutions
- **report-template.md**: Validation report structure

Load these references as needed during validation to ensure thorough evaluation and accurate recommendations.
