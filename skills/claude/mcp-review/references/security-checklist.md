# MCP Configuration Security Checklist

This checklist provides comprehensive security evaluation criteria for MCP server configurations.

## Security Priority Levels

- 🔴 **CRITICAL**: Must fix immediately - exposes secrets or creates security vulnerability
- 🟠 **HIGH**: Should fix soon - reduces security posture significantly
- 🟡 **MEDIUM**: Recommended - improves security best practices
- 🟢 **LOW**: Optional - minor security enhancement

## 1. Secret Management

### 🔴 CRITICAL: No Hardcoded Secrets

**Check for:**
- API keys in plain text
- Authentication tokens
- Passwords
- OAuth client secrets
- Private keys or certificates

**Examples of violations:**

❌ **BAD - Hardcoded API key:**
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

✅ **GOOD - Environment variable:**
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

**Validation:**
- Search for patterns: `sk_`, `token_`, `key_`, `secret_`
- Check headers for hardcoded values
- Verify URLs don't contain credentials
- Scan args for embedded secrets

**Remediation:**
1. Extract secret to environment variable
2. Update configuration to use `${VAR}` syntax
3. Document required environment variable
4. Rotate compromised credentials
5. Add to .gitignore if in separate file

### 🔴 CRITICAL: Proper Environment Variable Syntax

**Check for:**
- Correct `${VAR}` syntax
- No shell-style `$VAR` syntax
- Proper escaping if needed

**Examples:**

❌ **BAD - Shell syntax:**
```json
{
  "url": "$API_URL/mcp"
}
```

✅ **GOOD - Correct syntax:**
```json
{
  "url": "${API_URL}/mcp"
}
```

✅ **GOOD - With default:**
```json
{
  "url": "${API_URL:-https://api.example.com}/mcp"
}
```

**Validation:**
- Search for `$[A-Z_]` pattern (shell style)
- Verify `${VAR}` or `${VAR:-default}` format
- Check for typos in variable names

**Remediation:**
1. Replace `$VAR` with `${VAR}`
2. Add defaults where appropriate
3. Test variable expansion

### 🟠 HIGH: Scope Appropriateness

**Check for:**
- Secrets in project scope (version controlled)
- Personal credentials in project scope
- Team credentials in local scope

**Scope decision matrix:**

| Configuration Type | Appropriate Scope | Reason |
|-------------------|------------------|---------|
| API keys | local | Personal, sensitive |
| Team tools (no auth) | project | Shared, non-sensitive |
| User-specific tools | user | Cross-project personal |
| OAuth tokens | local | User-specific, sensitive |
| Public endpoints | project | Shared, non-sensitive |

**Examples:**

❌ **BAD - Personal API key in project scope:**
```json
// .mcp.json (version controlled)
{
  "mcpServers": {
    "personal-api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MY_PERSONAL_KEY}"
      }
    }
  }
}
```

Even with environment variable, this signals personal credentials should be in local scope.

✅ **GOOD - Team tool in project scope:**
```json
// .mcp.json (version controlled)
{
  "mcpServers": {
    "shared-docs": {
      "command": "uvx",
      "args": ["company-docs-mcp@latest"]
    }
  }
}
```

**Validation:**
- Check if project .mcp.json references personal services
- Verify team tools are in project scope
- Confirm authentication method matches scope

**Remediation:**
1. Move personal configs to local scope: `claude mcp add --scope local`
2. Document that team members set up locally
3. Keep shared tools in project scope
4. Update README with scope guidance

## 2. Transport Security

### 🔴 CRITICAL: HTTPS for Production

**Check for:**
- HTTP URLs in production configs
- Unencrypted transport for sensitive data
- Mixed content issues

**Examples:**

❌ **BAD - HTTP in production:**
```json
{
  "url": "http://api.production.com/mcp"
}
```

✅ **GOOD - HTTPS:**
```json
{
  "url": "https://api.production.com/mcp"
}
```

✅ **ACCEPTABLE - HTTP for localhost:**
```json
{
  "url": "${API_URL:-http://localhost:3000}/mcp"
}
```

**Validation:**
- Flag `http://` URLs (except localhost/127.0.0.1)
- Verify production environments use HTTPS
- Check for environment-based URL switching

**Remediation:**
1. Update URLs to HTTPS
2. Verify certificates are valid
3. Test connectivity over HTTPS
4. Use environment variables for flexibility

### 🟠 HIGH: Authentication Method

**Check for:**
- Appropriate authentication for service
- Secure header format
- OAuth configuration completeness

**Authentication patterns:**

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

**OAuth 2.0:**
```json
{
  "type": "http",
  "url": "https://api.service.com/mcp",
  "oauth": {
    "authorizationUrl": "https://auth.service.com/oauth/authorize",
    "tokenUrl": "https://auth.service.com/oauth/token"
  }
}
```

**Validation:**
- Verify authentication method matches service requirements
- Check header names are correct (case-sensitive)
- Confirm OAuth URLs are provided if needed
- Validate token format expectations

**Remediation:**
1. Consult service documentation for auth method
2. Use correct header format
3. Add OAuth configuration if required
4. Document authentication setup steps

## 3. Command Injection Prevention (stdio)

### 🔴 CRITICAL: Argument Safety

**Check for:**
- User input in command arguments
- Unvalidated environment variables in args
- Shell injection possibilities

**Examples:**

❌ **DANGEROUS - User input in args:**
```json
{
  "command": "sh",
  "args": ["-c", "process ${USER_INPUT}"]
}
```

✅ **SAFE - Fixed arguments:**
```json
{
  "command": "npx",
  "args": ["-y", "trusted-package@1.0.0"]
}
```

✅ **SAFE - Controlled environment variables:**
```json
{
  "command": "node",
  "args": ["server.js", "--port", "${SERVER_PORT:-3000}"]
}
```

**Validation:**
- Flag use of `sh -c` or `bash -c` with variables
- Check for suspicious command patterns
- Verify args are from trusted sources
- Ensure no dynamic command construction

**Remediation:**
1. Avoid shell execution with user input
2. Use direct command execution
3. Validate environment variables
4. Pin package versions

### 🟠 HIGH: Executable Trust

**Check for:**
- Untrusted executables
- Unverified package sources
- Missing version pinning

**Best practices:**

✅ **GOOD - Pinned version:**
```json
{
  "command": "npx",
  "args": ["-y", "@verified/package@1.2.3"]
}
```

⚠️ **RISKY - Latest version:**
```json
{
  "command": "npx",
  "args": ["-y", "some-package@latest"]
}
```

**Validation:**
- Check if packages are from trusted sources
- Verify version pinning for critical tools
- Confirm packages are actively maintained
- Review package reputation

**Remediation:**
1. Pin versions for production
2. Use official/verified packages
3. Review package before use
4. Consider using `@latest` only for development

## 4. Configuration Validation

### 🟡 MEDIUM: Input Validation

**Check for:**
- URL format validation
- Port range validation
- Timeout reasonable values

**Examples:**

⚠️ **RISKY - No validation:**
```json
{
  "url": "${CUSTOM_URL}/mcp"
}
```

✅ **BETTER - Default and validation:**
```json
{
  "url": "${API_URL:-https://api.example.com}/mcp"
}
```

**Validation:**
- Provide sensible defaults
- Document expected formats
- Validate ranges for numeric values
- Check URL construction safety

**Remediation:**
1. Add default values with `${VAR:-default}`
2. Document expected format in README
3. Provide examples of valid values
4. Consider validation in custom servers

### 🟡 MEDIUM: Error Information Disclosure

**Check for:**
- Verbose error messages in production
- Debug modes enabled
- Sensitive info in logs

**Examples:**

⚠️ **RISKY - Debug enabled:**
```json
{
  "command": "node",
  "args": ["server.js", "--debug", "--verbose"]
}
```

✅ **BETTER - Environment-controlled:**
```json
{
  "command": "node",
  "args": ["server.js", "--log-level", "${LOG_LEVEL:-error}"]
}
```

**Validation:**
- Check for hardcoded debug flags
- Verify log levels are appropriate
- Review error handling in custom servers

**Remediation:**
1. Use environment variables for debug mode
2. Set appropriate default log levels
3. Avoid verbose logging in production
4. Sanitize error messages

## 5. Access Control

### 🟠 HIGH: Principle of Least Privilege

**Check for:**
- Excessive permissions requested
- Unnecessary file system access
- Overly broad API scopes

**Guidelines:**
- Request minimum necessary permissions
- Scope API access appropriately
- Limit file system access
- Use read-only when possible

**Validation:**
- Review requested permissions/scopes
- Verify necessity of each permission
- Check if read-only alternatives exist
- Confirm scope matches use case

**Remediation:**
1. Reduce requested permissions
2. Use narrower API scopes
3. Implement read-only where possible
4. Document why permissions are needed

### 🟡 MEDIUM: Network Access

**Check for:**
- Unrestricted network access
- Connections to untrusted hosts
- Missing network timeout configurations

**Best practices:**

✅ **GOOD - Timeout configured:**
```json
{
  "type": "http",
  "url": "https://api.example.com/mcp",
  "timeout": 30000
}
```

**Validation:**
- Check for timeout configurations
- Verify hosts are trusted
- Review network access patterns
- Confirm HTTPS for external connections

**Remediation:**
1. Add reasonable timeouts
2. Restrict to trusted hosts
3. Use HTTPS for external services
4. Document network requirements

## 6. Data Privacy

### 🔴 CRITICAL: No PII in Configuration

**Check for:**
- Personal identifiable information
- Email addresses
- User names or IDs
- IP addresses

**Examples:**

❌ **BAD - Email in config:**
```json
{
  "user": "john.doe@company.com"
}
```

✅ **GOOD - Environment variable:**
```json
{
  "user": "${USER_EMAIL}"
}
```

**Validation:**
- Search for email patterns
- Check for name patterns
- Flag IP addresses (non-localhost)
- Scan for user identifiers

**Remediation:**
1. Move PII to environment variables
2. Use generic placeholders in examples
3. Document data privacy requirements
4. Review compliance needs

### 🟡 MEDIUM: Data Transmission

**Check for:**
- Sensitive data in URLs (query params)
- Unencrypted data transmission
- Data retention policies

**Best practices:**
- Send sensitive data in headers/body, not URLs
- Use HTTPS for all sensitive transmissions
- Document data handling policies
- Consider data minimization

**Validation:**
- Check for secrets in URL query parameters
- Verify encryption for sensitive data
- Review data handling documentation

**Remediation:**
1. Move secrets from URLs to headers
2. Use POST for sensitive operations
3. Encrypt sensitive data transmission
4. Document data policies

## Security Review Workflow

### Step 1: Automated Checks

Run these automated validations:

1. **Secret Detection:**
   ```bash
   grep -E "(sk_|token_|key_|secret_|password|api.*key)" .mcp.json
   ```

2. **HTTP URLs:**
   ```bash
   grep -E '"url".*"http://' .mcp.json
   ```

3. **Hardcoded Values:**
   ```bash
   grep -v '\${' .mcp.json | grep -E '(bearer|token|key)'
   ```

### Step 2: Manual Review

1. Read entire configuration
2. Verify scope appropriateness
3. Check authentication methods
4. Review command safety (stdio)
5. Validate environment variable usage

### Step 3: Documentation Review

1. Check if required variables are documented
2. Verify setup instructions are clear
3. Confirm security notes are included
4. Review example configurations

### Step 4: Testing

1. Test configuration loads correctly
2. Verify environment variables work
3. Check authentication succeeds
4. Confirm proper error handling

### Step 5: Report Findings

Classify issues by priority:
- 🔴 Critical: Fix immediately
- 🟠 High: Fix before production
- 🟡 Medium: Recommended improvements
- 🟢 Low: Optional enhancements

## Common Security Issues

### Issue: API Key in Version Control

**Detection:**
- Search for `sk_`, `token_`, hardcoded values
- Check git history for previous leaks

**Impact:** CRITICAL - Credentials exposed

**Fix:**
1. Rotate compromised credentials immediately
2. Move to environment variable
3. Update .gitignore
4. Audit access logs for unauthorized use

### Issue: HTTP in Production

**Detection:**
- Look for `"http://"` in production configs
- Check environment-specific URLs

**Impact:** HIGH - Data transmitted unencrypted

**Fix:**
1. Update URL to HTTPS
2. Verify certificate validity
3. Test connection
4. Update documentation

### Issue: Overly Permissive Scope

**Detection:**
- Personal credentials in project scope
- Check scope settings in CLI output

**Impact:** HIGH - Credentials shared inappropriately

**Fix:**
1. Move to local scope
2. Update team documentation
3. Verify team member setup
4. Review approval settings

### Issue: Unvalidated User Input in Commands

**Detection:**
- Look for `sh -c` or `bash -c`
- Check for variable expansion in commands

**Impact:** CRITICAL - Command injection risk

**Fix:**
1. Remove shell execution
2. Use direct command invocation
3. Validate all inputs
4. Use fixed argument lists

### Issue: Missing Environment Variable Documentation

**Detection:**
- Check for `${VAR}` without README mention
- Verify setup instructions exist

**Impact:** MEDIUM - Setup confusion, errors

**Fix:**
1. Document all required variables
2. Provide example values
3. Add setup instructions
4. Include troubleshooting guide

## Security Best Practices Summary

1. **Never commit secrets** - Use environment variables
2. **Use HTTPS** - Encrypt data in transit
3. **Choose appropriate scope** - Local for secrets, project for shared
4. **Pin versions** - Avoid unexpected updates in production
5. **Validate inputs** - Prevent injection attacks
6. **Least privilege** - Request minimum necessary permissions
7. **Document security** - Clear setup and requirements
8. **Regular reviews** - Audit configurations periodically
9. **Test thoroughly** - Verify security controls work
10. **Rotate credentials** - Regular key rotation policy
