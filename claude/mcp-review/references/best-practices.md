# MCP Configuration Best Practices

This document provides comprehensive best practices for MCP server configuration in Claude Code.

## Scope Selection

### Project Scope (`.mcp.json` in project root or skill directory)

**When to use:**
- Team collaboration on shared tools
- Version controlled configurations
- Non-sensitive server configurations
- Deterministic team environments

**Characteristics:**
- Stored in `.mcp.json` file within project
- Committed to version control
- Requires team approval on first use
- Shared across all team members

**Example structure:**
```json
{
  "mcpServers": {
    "shared-api": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

**Best practices:**
- Use environment variables for all sensitive data
- Provide sensible defaults with `${VAR:-default}` syntax
- Document required environment variables in README
- Never commit actual secrets
- Reset project choices with `claude mcp reset-project-choices` if needed

### Local Scope (User settings, not version controlled)

**When to use:**
- Personal API keys and tokens
- Experimental server configurations
- User-specific customizations
- Development and testing

**Characteristics:**
- Stored in user-specific Claude Code settings
- Not committed to version control
- No team approval required
- Personal to each developer

**Example:**
```bash
claude mcp add --transport http personal-api --scope local \
  --env API_KEY=your-secret-key \
  https://api.personal.com/mcp
```

**Best practices:**
- Use for all configurations with hardcoded secrets
- Separate from project configurations
- Document that team members need to set up locally
- Provide setup instructions in project README

### User Scope (Cross-project tools)

**When to use:**
- Tools used across multiple projects
- Global development utilities
- Frequently used MCP servers
- Personal productivity tools

**Characteristics:**
- Stored in user-level Claude Code settings
- Available in all projects
- Personal to each user
- Persistent across projects

**Example:**
```bash
claude mcp add --transport stdio productivity-tool --scope user \
  -- npx -y @my/productivity-mcp
```

**Best practices:**
- Use for commonly needed tools
- Keep separate from project-specific configurations
- Document in personal setup guides
- Consider version consistency across projects

## Transport Types

### stdio (Standard Input/Output)

**When to use:**
- Local processes and scripts
- NPM packages via npx
- Python packages via uvx
- Custom local tools

**Configuration:**
```json
{
  "mcpServers": {
    "local-tool": {
      "command": "npx",
      "args": ["-y", "package-name@latest"]
    }
  }
}
```

**Best practices:**
- Use `-y` flag with npx to auto-confirm
- Specify `@latest` or pin versions for consistency
- For Windows: Add `cmd /c` wrapper on native Windows (not WSL)
- Verify executable is in PATH or use full path
- Test command independently before adding to config

**Common patterns:**

NPM packages:
```json
{
  "command": "npx",
  "args": ["-y", "@scope/package@1.0.0"]
}
```

Python packages:
```json
{
  "command": "uvx",
  "args": ["package-name@latest"]
}
```

Custom scripts:
```json
{
  "command": "node",
  "args": ["/full/path/to/script.js"]
}
```

### http (HTTP/HTTPS)

**When to use:**
- Cloud-based MCP servers
- Remote APIs
- Third-party services
- Production MCP endpoints

**Configuration:**
```json
{
  "mcpServers": {
    "cloud-service": {
      "type": "http",
      "url": "https://mcp.service.com/endpoint",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}",
        "X-Custom-Header": "${CUSTOM_VALUE}"
      }
    }
  }
}
```

**Best practices:**
- Always use HTTPS for production
- Store tokens in environment variables
- Use proper header format for authentication
- Include OAuth setup instructions if needed
- Test endpoint accessibility before configuration
- Document required headers and authentication

**OAuth 2.0 setup:**
1. Add server configuration with OAuth URL
2. Run `/mcp` command in Claude Code
3. Complete authentication flow
4. Server will be authorized for use

### sse (Server-Sent Events) - DEPRECATED

**Status:** Deprecated in favor of HTTP transport

**Migration path:**
```json
// Old (sse)
{
  "command": "npx",
  "args": ["mcp-remote", "https://service.com/sse"]
}

// New (http)
{
  "type": "http",
  "url": "https://service.com/mcp"
}
```

**Best practices:**
- Migrate to http transport when possible
- Check service documentation for http endpoint
- Flag sse usage in reviews with migration recommendation

## Environment Variables

### Syntax and Usage

**Basic syntax:**
```json
{
  "url": "${API_BASE_URL}/mcp",
  "headers": {
    "Authorization": "Bearer ${API_KEY}"
  }
}
```

**With defaults:**
```json
{
  "url": "${API_BASE_URL:-https://api.example.com}/mcp",
  "headers": {
    "X-Environment": "${ENVIRONMENT:-production}"
  }
}
```

**Best practices:**
- Use `${VAR}` for required variables
- Use `${VAR:-default}` for optional with fallback
- Document all required variables
- Provide sensible defaults where appropriate
- Use descriptive variable names
- Group related variables with common prefix

### Security Guidelines

**DO:**
- ✅ Store all secrets in environment variables
- ✅ Use meaningful variable names (API_KEY not KEY)
- ✅ Document required variables in README
- ✅ Provide example values (sanitized) in documentation
- ✅ Use .env files for local development (gitignored)

**DON'T:**
- ❌ Hardcode API keys or tokens
- ❌ Commit actual secrets to version control
- ❌ Use generic names like VAR1, VAR2
- ❌ Include secrets in example configurations
- ❌ Share actual credentials in team chat

### Documentation Template

Include in project README:

```markdown
## MCP Server Configuration

This project uses the following MCP servers:

### Required Environment Variables

- `API_KEY`: Your API key from [Service](https://service.com/keys)
- `API_BASE_URL`: (Optional) API base URL, defaults to https://api.example.com
- `ENVIRONMENT`: (Optional) Environment name, defaults to production

### Setup

1. Copy environment template:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. Edit .env with your credentials:
   \`\`\`
   API_KEY=your_actual_key_here
   API_BASE_URL=https://api.example.com
   \`\`\`

3. Approve project MCP settings when prompted by Claude Code
```

## Common Patterns

### Multi-Server Configuration

```json
{
  "mcpServers": {
    "documentation": {
      "command": "uvx",
      "args": ["docs-mcp-server@latest"]
    },
    "api-server": {
      "type": "http",
      "url": "${API_URL}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    },
    "local-tools": {
      "command": "npx",
      "args": ["-y", "@company/mcp-tools@latest"]
    }
  }
}
```

### Conditional Configuration

Use environment variables to enable/disable servers:

```json
{
  "mcpServers": {
    "production-api": {
      "type": "http",
      "url": "${PROD_API_URL}/mcp",
      "headers": {
        "Authorization": "Bearer ${PROD_API_KEY}"
      }
    }
  }
}
```

Team members without `PROD_API_URL` can use development alternatives.

### Windows Compatibility

For native Windows (not WSL):

```json
{
  "mcpServers": {
    "npm-package": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "package-name@latest"]
    }
  }
}
```

For cross-platform:
```json
{
  "mcpServers": {
    "cross-platform": {
      "command": "${SHELL_COMMAND:-npx}",
      "args": ["${SHELL_ARGS:--y}", "package-name@latest"]
    }
  }
}
```

Set `SHELL_COMMAND=cmd` and `SHELL_ARGS=/c` on Windows.

## Troubleshooting

### Connection Issues

**Symptoms:** Server fails to connect

**Checks:**
1. Verify server URL is accessible
2. Check environment variables are set
3. Validate JSON syntax
4. Test command independently (for stdio)
5. Check firewall/proxy settings

**Solutions:**
- Use `/mcp` command to check server status
- Verify environment variables with `echo $VAR_NAME`
- Test http endpoints with curl
- Check Claude Code logs for detailed errors

### Authentication Failures

**Symptoms:** 401/403 errors, authentication required

**Checks:**
1. API key is valid and not expired
2. Environment variable is correctly named
3. Header format matches API requirements
4. OAuth flow completed (if applicable)

**Solutions:**
- Regenerate API key if expired
- Use `/mcp` for OAuth authentication
- Check header syntax: `"Authorization": "Bearer ${KEY}"`
- Verify token format (Bearer, Basic, etc.)

### Windows Execution Errors

**Symptoms:** Command not found, execution fails on Windows

**Checks:**
1. Verify if using native Windows or WSL
2. Check if cmd /c wrapper is needed
3. Verify npx/node is in PATH
4. Test command in PowerShell/CMD

**Solutions:**
- Add `cmd /c` wrapper for native Windows
- Use full paths if PATH issues exist
- Install Node.js if missing
- Use WSL for better compatibility

### Scope and Approval Issues

**Symptoms:** Project settings not loading, approval prompts

**Checks:**
1. Verify .mcp.json location
2. Check if project scope was approved
3. Validate JSON syntax
4. Review scope choice (project vs local)

**Solutions:**
- Use `claude mcp reset-project-choices` to reset
- Move sensitive configs to local scope
- Ensure team approves project configurations
- Check .mcp.json is in correct directory

## Advanced Configuration

### Output Limits

For servers that may return large data:

```bash
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

Default limits:
- Warning at 10,000 tokens
- Maximum 25,000 tokens

Adjust based on use case and performance needs.

### Enterprise Management

For centralized configuration:

**Location:**
- macOS: `/Library/Application Support/ClaudeCode/managed-mcp.json`
- Windows: `C:\ProgramData\ClaudeCode\managed-mcp.json`
- Linux: `/etc/claude-code/managed-mcp.json`

**Allow/Deny Lists:**
```json
{
  "allowedMcpServers": [
    { "serverName": "approved-server" }
  ],
  "deniedMcpServers": [
    { "serverName": "blocked-server" }
  ]
}
```

**Important:** Deny list takes absolute precedence.

### Custom MCP Servers

When building custom servers:

1. Follow MCP protocol specification
2. Implement proper error handling
3. Return structured responses
4. Handle authentication securely
5. Document configuration requirements
6. Provide example .mcp.json

**Example custom server config:**
```json
{
  "mcpServers": {
    "custom-server": {
      "command": "node",
      "args": ["./custom-mcp-server/index.js"],
      "env": {
        "SERVER_PORT": "${MCP_PORT:-3000}",
        "LOG_LEVEL": "${LOG_LEVEL:-info}"
      }
    }
  }
}
```

## Review Checklist

Use this checklist when reviewing configurations:

- [ ] Valid JSON syntax
- [ ] Proper mcpServers object structure
- [ ] No hardcoded secrets
- [ ] Environment variables use ${VAR} syntax
- [ ] Appropriate scope choice (project/local/user)
- [ ] Correct transport type for use case
- [ ] Required environment variables documented
- [ ] Windows compatibility considered
- [ ] OAuth setup documented (if applicable)
- [ ] Executable paths verified (stdio)
- [ ] HTTPS used for production endpoints
- [ ] Headers properly formatted
- [ ] Default values sensible and documented
- [ ] .mcp.json location correct for scope
- [ ] README includes setup instructions
