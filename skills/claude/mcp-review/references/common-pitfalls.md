# Common MCP Configuration Pitfalls

This document catalogs frequent issues encountered when configuring MCP servers and provides solutions.

## 1. Windows Compatibility Issues

### Pitfall: npx Fails on Native Windows

**Symptom:**
```
Error: 'npx' is not recognized as an internal or external command
```

**Cause:**
Native Windows (not WSL) requires `cmd /c` wrapper for npx commands.

**Detection:**
- Check if configuration is used on Windows
- Test command independently in CMD/PowerShell
- Review platform compatibility

**Incorrect Configuration:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "package-name@latest"]
    }
  }
}
```

**Correct Configuration:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "package-name@latest"]
    }
  }
}
```

**Cross-Platform Solution:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "${NPX_COMMAND:-npx}",
      "args": ["${NPX_ARGS:--y}", "package-name@latest"]
    }
  }
}
```

Then on Windows:
```bash
set NPX_COMMAND=cmd
set NPX_ARGS=/c npx -y
```

**Prevention:**
- Document Windows-specific setup
- Test on multiple platforms
- Use environment variables for cross-platform compatibility
- Note: WSL users don't need cmd /c wrapper

---

## 2. Environment Variable Issues

### Pitfall: Wrong Variable Syntax

**Symptom:**
Variable not expanded, literal `$VAR` appears in configuration

**Cause:**
Using shell-style `$VAR` instead of `${VAR}` syntax

**Detection:**
- Search for `$[A-Z_]` pattern without braces
- Check if variables are expanded correctly
- Test with `/mcp` command

**Incorrect:**
```json
{
  "url": "$API_URL/mcp"
}
```

**Correct:**
```json
{
  "url": "${API_URL}/mcp"
}
```

**With Default:**
```json
{
  "url": "${API_URL:-https://api.example.com}/mcp"
}
```

**Prevention:**
- Always use `${VAR}` syntax
- Add defaults with `${VAR:-default}`
- Validate syntax in reviews
- Test variable expansion

### Pitfall: Undefined Environment Variables

**Symptom:**
Empty values, connection failures, missing authentication

**Cause:**
Required environment variables not set

**Detection:**
- Check for `${VAR}` without defaults
- Review error messages for missing values
- Test configuration without variables set

**Issue:**
```json
{
  "headers": {
    "Authorization": "Bearer ${API_KEY}"
  }
}
```

If `API_KEY` is not set, header becomes `"Authorization": "Bearer "`

**Solution:**
```json
{
  "headers": {
    "Authorization": "Bearer ${API_KEY}"
  }
}
```

Plus documentation:
```markdown
## Required Environment Variables

- `API_KEY`: Your API key from [Service](https://service.com/keys)

Set before running:
\`\`\`bash
export API_KEY=your_key_here
claude
\`\`\`
```

**Prevention:**
- Document all required variables
- Provide setup instructions
- Add validation in custom servers
- Consider defaults where appropriate

### Pitfall: Variable in Wrong Context

**Symptom:**
Variable not expanded, appears literally

**Cause:**
Environment variables only work in specific fields

**Supported fields:**
- `url`
- `headers` (values)
- `args` (some contexts)
- `env` (values)

**Not supported:**
- `command` (usually)
- JSON keys
- Most structural fields

**Incorrect:**
```json
{
  "mcpServers": {
    "${SERVER_NAME}": {  // Won't work
      "type": "http"
    }
  }
}
```

**Correct:**
```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_URL}/mcp"  // Works
    }
  }
}
```

**Prevention:**
- Use variables only in supported fields
- Test configuration loading
- Check documentation for supported fields

---

## 3. Scope and Approval Issues

### Pitfall: Project Settings Not Approved

**Symptom:**
Project .mcp.json ignored, servers not available

**Cause:**
Team member hasn't approved project MCP settings

**Detection:**
- Check if `/mcp` shows project servers
- Verify approval status in Claude Code
- Review project scope settings

**Solution:**
1. User must approve project settings when prompted
2. If prompt missed, reset with:
   ```bash
   claude mcp reset-project-choices
   ```
3. Restart Claude Code
4. Approve when prompted

**Prevention:**
- Document approval requirement
- Communicate to team when adding project servers
- Provide reset command in troubleshooting docs

### Pitfall: Secrets in Project Scope

**Symptom:**
Security warning, credentials in version control

**Cause:**
Personal API keys in project .mcp.json

**Detection:**
- Check if .mcp.json contains `${PERSONAL_*}` or `${MY_*}`
- Review authentication headers
- Verify scope appropriateness

**Issue:**
```json
// .mcp.json (project scope, version controlled)
{
  "mcpServers": {
    "personal-api": {
      "type": "http",
      "headers": {
        "Authorization": "Bearer ${MY_API_KEY}"
      }
    }
  }
}
```

**Solution:**
Move to local scope:
```bash
claude mcp add --transport http personal-api --scope local \
  --env MY_API_KEY=actual_key \
  https://api.example.com/mcp
```

**Prevention:**
- Use project scope for shared, non-sensitive configs
- Use local scope for personal credentials
- Document scope choices in README
- Review configurations before committing

### Pitfall: Local Override Conflicts

**Symptom:**
Project configuration ignored, unexpected server used

**Cause:**
Local scope server with same name overrides project

**Behavior:**
Priority order: local > project > user

**Detection:**
- Check `/mcp` output for source
- List servers: `claude mcp list`
- Review all scope levels

**Solution:**
1. Remove local override if unintended:
   ```bash
   claude mcp remove server-name --scope local
   ```
2. Or rename to avoid conflict
3. Document intentional overrides

**Prevention:**
- Use distinct server names across scopes
- Document scope precedence in README
- Review all scopes during setup

---

## 4. Authentication Problems

### Pitfall: Missing OAuth Setup

**Symptom:**
401 Unauthorized, authentication required

**Cause:**
OAuth server added but not authenticated

**Detection:**
- Check server type is http with OAuth
- Review error messages for auth failures
- Test server connection

**Configuration:**
```json
{
  "mcpServers": {
    "oauth-service": {
      "type": "http",
      "url": "https://api.service.com/mcp"
    }
  }
}
```

**Missing Step:**
Must run `/mcp` command in Claude Code and complete OAuth flow

**Solution:**
1. Add server configuration
2. Run `/mcp` in Claude Code
3. Click authenticate for the server
4. Complete OAuth flow in browser
5. Verify connection successful

**Prevention:**
- Document OAuth requirement
- Include setup steps in README
- Provide OAuth troubleshooting guide

### Pitfall: Incorrect Authorization Header Format

**Symptom:**
401/403 errors, authentication failures

**Cause:**
Wrong header name or format for service

**Common Formats:**

**Bearer Token:**
```json
{
  "headers": {
    "Authorization": "Bearer ${API_TOKEN}"
  }
}
```

**Basic Auth:**
```json
{
  "headers": {
    "Authorization": "Basic ${BASE64_CREDENTIALS}"
  }
}
```

**API Key Header:**
```json
{
  "headers": {
    "X-API-Key": "${API_KEY}"
  }
}
```

**Custom Header:**
```json
{
  "headers": {
    "X-Service-Token": "${SERVICE_TOKEN}"
  }
}
```

**Detection:**
- Review service API documentation
- Check header name (case-sensitive)
- Verify token format requirements
- Test with curl/Postman first

**Prevention:**
- Consult API docs for exact format
- Test authentication independently
- Provide examples in documentation
- Verify header names are exact

### Pitfall: Expired or Invalid Tokens

**Symptom:**
Previously working configuration now fails

**Cause:**
API key expired, rotated, or revoked

**Detection:**
- Check token validity independently
- Review service dashboard for key status
- Test with new token

**Solution:**
1. Generate new API key from service
2. Update environment variable:
   ```bash
   export API_KEY=new_key_here
   ```
3. Restart Claude Code
4. Test connection

**Prevention:**
- Document token rotation process
- Set up monitoring for expiration
- Keep backup authentication methods
- Document key generation steps

---

## 5. Network and Connectivity Issues

### Pitfall: Firewall Blocking Connections

**Symptom:**
Connection timeout, cannot reach server

**Cause:**
Corporate firewall, proxy, or network restrictions

**Detection:**
- Test URL accessibility with curl
- Check proxy settings
- Review firewall logs
- Test from different network

**Solution:**
1. Configure proxy if needed:
   ```bash
   export HTTPS_PROXY=http://proxy.company.com:8080
   ```
2. Whitelist MCP server domains
3. Use VPN if required
4. Contact IT for firewall rules

**Prevention:**
- Document network requirements
- Provide proxy configuration guide
- Test in production environment
- Maintain list of required domains

### Pitfall: SSL Certificate Issues

**Symptom:**
SSL/TLS errors, certificate verification failures

**Cause:**
Self-signed certificates, expired certificates, hostname mismatch

**Detection:**
- Test with curl: `curl -v https://api.example.com`
- Check certificate validity
- Verify hostname matches

**Solution:**

For valid certificates:
```bash
# Update system certificates
# macOS
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain cert.pem
```

For self-signed (development only):
```json
{
  "url": "${API_URL:-https://localhost:3000}/mcp",
  "rejectUnauthorized": false  // NOT for production
}
```

**Prevention:**
- Use valid certificates in production
- Document certificate requirements
- Provide certificate installation steps
- Regular certificate renewal

### Pitfall: DNS Resolution Failures

**Symptom:**
"Could not resolve host" errors

**Cause:**
Invalid hostname, DNS not configured, internal hostname

**Detection:**
- Test DNS: `nslookup api.example.com`
- Verify hostname spelling
- Check VPN requirement for internal hosts

**Solution:**
1. Verify hostname is correct
2. Connect to VPN if needed for internal hosts
3. Use IP address as workaround (not recommended)
4. Configure DNS settings

**Prevention:**
- Use public DNS for cloud services
- Document VPN requirements
- Provide alternative endpoints
- Verify hostname before configuration

---

## 6. Configuration Format Issues

### Pitfall: Invalid JSON Syntax

**Symptom:**
Configuration not loaded, parse errors

**Cause:**
Syntax errors in JSON

**Common Issues:**
- Missing commas
- Trailing commas (not allowed in strict JSON)
- Unquoted keys
- Single quotes instead of double
- Comments (not allowed in JSON)

**Incorrect:**
```json
{
  "mcpServers": {
    "server1": {
      "type": "http",
      "url": 'https://api.example.com'  // Single quotes
    },
    // Comment not allowed
    "server2": {
      "type": "http"
      "url": "https://api2.example.com"  // Missing comma
    },
  }  // Trailing comma
}
```

**Correct:**
```json
{
  "mcpServers": {
    "server1": {
      "type": "http",
      "url": "https://api.example.com"
    },
    "server2": {
      "type": "http",
      "url": "https://api2.example.com"
    }
  }
}
```

**Detection:**
- Use JSON validator
- Check editor syntax highlighting
- Review error messages
- Test with `jq` or similar

**Prevention:**
- Use editor with JSON validation
- Format with prettier/similar
- Validate before committing
- Use JSON schema validation

### Pitfall: Wrong File Location

**Symptom:**
Project servers not loading

**Cause:**
.mcp.json in wrong directory

**Correct Locations:**

**Project scope:**
```
project-root/
├── .mcp.json          # ✅ Correct
└── src/
    └── .mcp.json      # ❌ Wrong location
```

**Skill scope:**
```
skills/
└── my-skill/
    ├── .mcp.json      # ✅ Correct for skill
    └── SKILL.md
```

**Detection:**
- Verify file location relative to project root
- Check if Claude Code detects the file
- Review `/mcp` output

**Solution:**
1. Move .mcp.json to correct location
2. Remove from wrong location
3. Restart Claude Code
4. Approve project settings

**Prevention:**
- Document correct file location
- Provide project structure example
- Use project templates
- Validate structure in CI

---

## 7. Command Execution Issues (stdio)

### Pitfall: Executable Not in PATH

**Symptom:**
"Command not found" errors

**Cause:**
Command not installed or not in PATH

**Detection:**
- Test command: `which node` or `where npx`
- Check PATH: `echo $PATH`
- Verify installation

**Solution:**

Use full path:
```json
{
  "command": "/usr/local/bin/node",
  "args": ["server.js"]
}
```

Or ensure in PATH:
```bash
export PATH="/usr/local/bin:$PATH"
```

**Prevention:**
- Document installation requirements
- Provide setup instructions
- Use environment variables for paths
- Test on clean environment

### Pitfall: Missing Package Dependencies

**Symptom:**
"Module not found" errors from npx

**Cause:**
Package not installed or version mismatch

**Detection:**
- Test package: `npx package-name --version`
- Check installation
- Review error messages

**Solution:**
1. Install package globally:
   ```bash
   npm install -g package-name
   ```
2. Or use npx with -y flag:
   ```json
   {
     "args": ["-y", "package-name@latest"]
   }
   ```

**Prevention:**
- Use `npx -y` for auto-install
- Document package requirements
- Pin versions for consistency
- Provide installation script

### Pitfall: Incorrect Argument Format

**Symptom:**
Server starts but doesn't work correctly

**Cause:**
Arguments in wrong format or order

**Common Issues:**
- Missing required arguments
- Wrong argument order
- Incorrect flag format
- Missing equals sign for options

**Incorrect:**
```json
{
  "args": ["--port 3000", "--host localhost"]  // Wrong: single string
}
```

**Correct:**
```json
{
  "args": ["--port", "3000", "--host", "localhost"]  // Each arg separate
}
```

**Alternative (some tools):**
```json
{
  "args": ["--port=3000", "--host=localhost"]  // Using = format
}
```

**Detection:**
- Review tool documentation for argument format
- Test command independently
- Check server logs

**Prevention:**
- Consult tool documentation
- Test command in terminal first
- Provide working examples
- Document argument requirements

---

## 8. Output and Performance Issues

### Pitfall: Large Output Truncation

**Symptom:**
Output cut off, "output too large" warnings

**Cause:**
MCP server returns data exceeding token limits

**Default Limits:**
- Warning at 10,000 tokens
- Maximum 25,000 tokens

**Solution:**
Increase limit:
```bash
export MAX_MCP_OUTPUT_TOKENS=50000
claude
```

**Proper Fix:**
- Implement pagination in server
- Filter data on server side
- Request only needed fields
- Use streaming for large responses

**Prevention:**
- Design servers with output limits in mind
- Document performance considerations
- Implement pagination
- Monitor output sizes

### Pitfall: Slow Server Response

**Symptom:**
Timeout errors, slow performance

**Cause:**
Server processing taking too long

**Detection:**
- Monitor response times
- Check server logs
- Review operation complexity

**Solution:**

Add timeout:
```json
{
  "type": "http",
  "url": "https://api.example.com/mcp",
  "timeout": 60000  // 60 seconds
}
```

**Better approach:**
- Optimize server operations
- Cache frequently accessed data
- Use background jobs for slow operations
- Implement streaming responses

**Prevention:**
- Set reasonable timeouts
- Monitor performance
- Optimize server code
- Use caching strategies

---

## 9. Versioning and Updates

### Pitfall: Breaking Changes from @latest

**Symptom:**
Previously working configuration breaks after update

**Cause:**
Using `@latest` and package updated with breaking changes

**Risky:**
```json
{
  "args": ["package-name@latest"]
}
```

**Safer:**
```json
{
  "args": ["package-name@1.2.3"]
}
```

**Detection:**
- Check package version: `npm info package-name version`
- Review changelog for breaking changes
- Monitor for unexpected behavior changes

**Solution:**
1. Pin to specific version
2. Test updates before deploying
3. Review changelog for breaking changes
4. Document version requirements

**Prevention:**
- Pin versions in production
- Use `@latest` only for development
- Maintain changelog awareness
- Test updates in staging

### Pitfall: Deprecated SSE Transport

**Symptom:**
Warning about deprecated transport

**Cause:**
Using sse transport (deprecated)

**Old Configuration:**
```json
{
  "mcpServers": {
    "service": {
      "command": "npx",
      "args": ["mcp-remote", "https://service.com/sse"]
    }
  }
}
```

**New Configuration:**
```json
{
  "mcpServers": {
    "service": {
      "type": "http",
      "url": "https://service.com/mcp"
    }
  }
}
```

**Detection:**
- Check for `mcp-remote` package usage
- Look for SSE URLs in configuration
- Review deprecation warnings

**Solution:**
1. Consult service documentation for http endpoint
2. Update configuration to http transport
3. Test new configuration
4. Remove old configuration

**Prevention:**
- Stay informed about deprecations
- Use http transport for new services
- Migrate from sse proactively
- Follow Claude Code updates

---

## Troubleshooting Workflow

When encountering MCP configuration issues:

### Step 1: Verify Basic Configuration
- [ ] JSON syntax is valid
- [ ] File is in correct location
- [ ] Required fields are present

### Step 2: Check Connectivity
- [ ] URL is accessible (for http)
- [ ] Command exists (for stdio)
- [ ] Firewall allows connection
- [ ] DNS resolves correctly

### Step 3: Validate Authentication
- [ ] Credentials are valid
- [ ] Header format is correct
- [ ] OAuth flow completed (if needed)
- [ ] Tokens not expired

### Step 4: Review Environment
- [ ] Environment variables are set
- [ ] Variable syntax is correct
- [ ] Defaults are provided
- [ ] Documentation is complete

### Step 5: Test Independently
- [ ] curl test for http servers
- [ ] Command line test for stdio
- [ ] Verify package versions
- [ ] Check error messages

### Step 6: Check Logs and Status
- [ ] Run `/mcp` command
- [ ] Review Claude Code logs
- [ ] Check server logs (if custom)
- [ ] Monitor network traffic

### Step 7: Seek Help
- [ ] Review documentation
- [ ] Check GitHub issues
- [ ] Consult service support
- [ ] Ask in community forums

## Prevention Strategies

1. **Use Templates**: Start from working examples
2. **Validate Early**: Test configuration as you build
3. **Document Everything**: Clear setup instructions
4. **Test Cross-Platform**: Verify on all target platforms
5. **Pin Versions**: Avoid unexpected updates
6. **Monitor Changes**: Track configuration updates
7. **Review Regularly**: Audit configurations periodically
8. **Automate Testing**: CI validation for configurations
9. **Learn from Issues**: Document solutions to problems
10. **Stay Updated**: Follow Claude Code release notes
