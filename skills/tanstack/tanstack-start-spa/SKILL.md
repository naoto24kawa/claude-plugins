---
name: tanstack-start-spa
description: This skill provides comprehensive implementation patterns, best practices, and ready-to-use templates for building Single Page Applications (SPAs) with TanStack Start. Use this skill when implementing routing, server functions, data loading, authentication, or any TanStack Start feature. Triggered by requests like "implement routing", "add authentication", "create server functions", "optimize data loading", or "set up TanStack Start project".
---

# TanStack Start SPA Implementation

## Overview

Provides implementation patterns, best practices, and production-ready templates for developing SPAs with TanStack Start. This skill offers comprehensive guidance on routing architecture, type-safe server functions, data loading strategies, authentication flows, and environment variable management.

**IMPORTANT**: This skill's patterns may become outdated. Always verify against the latest official TanStack Start documentation before implementing. Use WebSearch with `"TanStack Start" <feature> 2025 site:tanstack.com` to find current documentation.

## Initial Setup: Version Detection

**FIRST ACTION REQUIRED**: Before using this skill, detect the project's TanStack Start version:

```bash
# Check installed version in package.json
cat package.json | grep -A 2 "@tanstack/react-start"
```

**Version-specific documentation:**
- v1.x: `https://tanstack.com/router/v1/docs/framework/react/start`
- Latest: `https://tanstack.com/router/latest/docs/framework/react/start`

**Version-based workflow:**

1. **Version found in package.json**:
   - Use version-specific documentation URL
   - Search pattern: `"TanStack Start" <feature> v{major}.{minor} site:tanstack.com`
   - Example: `"TanStack Start" authentication v1.80 site:tanstack.com`

2. **No package.json or version not found**:
   - Assume latest version
   - Use latest documentation URL
   - Notify user that latest version patterns are being applied

3. **Version older than v1.60**:
   - Warn about potentially outdated version
   - Recommend migration guide review
   - Search: `"TanStack Start" migration guide v{old} to v{new} site:tanstack.com`

**Version detection checklist:**
- [ ] package.json checked for TanStack Start version
- [ ] Version identified or latest version assumed
- [ ] Correct documentation URL selected
- [ ] User informed of version being used for guidance

## Core Capabilities

### 1. Routing Architecture & Implementation

Design and implement file-based routing with TanStack Router.

**When to use:**
- Setting up new routes or route structures
- Creating dynamic routes or nested layouts
- Implementing route protection or access control
- Designing route hierarchies for complex applications

**Key patterns:**
- File-based routing conventions (`app/routes/`)
- Dynamic routes: `$paramName.tsx` → `:paramName`
- Pathless layouts: `_authed.tsx` for route groups
- Root route configuration in `__root.tsx`

**Latest patterns**: Search `"TanStack Start" routing file-based 2025 site:tanstack.com`
**Additional reference**: See `references/implementation-patterns.md#ルーティングパターン`

**Example - Basic Route:**
```tsx
// app/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPostFn({ id: params.postId })
    return { post }
  },
  component: PostComponent,
})

function PostComponent() {
  const { post } = Route.useLoaderData()
  return <article>{post.title}</article>
}
```

**Example - Protected Layout:**
Use the template in `assets/templates/auth-routes/_authed.tsx` as a starting point for authentication-protected route groups.

### 2. Server Functions Development

Implement type-safe server-side logic callable from anywhere in the application.

**When to use:**
- Creating API endpoints or data fetching logic
- Handling form submissions and mutations
- Implementing authentication operations
- Accessing server-only resources (database, APIs, secrets)

**Key patterns:**
- Input validation with Zod schemas
- Error handling (redirect, notFound, Error)
- Type-safe client-server communication
- Environment variable access (server-side only)

**Latest patterns**: Search `"TanStack Start" createServerFn validation 2025 site:tanstack.com`
**Additional reference**: See `references/implementation-patterns.md#server-functionsパターン`

**Example - Validated Server Function:**
```tsx
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(10),
})

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    const post = await db.posts.create({ data })
    return { success: true, post }
  })
```

### 3. Data Loading Strategies

Optimize data fetching with loaders, prefetching, and caching.

**When to use:**
- Implementing route loaders for data fetching
- Optimizing performance with parallel loading
- Integrating TanStack Query for caching
- Implementing preloading strategies

**Key concepts:**
- `beforeLoad`: Sequential execution (parent → child)
- `loader`: Parallel execution for optimal performance
- TanStack Query integration: `prefetchQuery` vs `ensureQueryData`
- Preloading: Intent-based (hover) and Viewport-based

**Latest patterns**: Search `"TanStack Start" loader TanStack Query 2025 site:tanstack.com`
**Additional reference**: See `references/implementation-patterns.md#データローディングパターン`

**Example - Parallel Loading:**
```tsx
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const [user, posts, stats] = await Promise.all([
      getUserFn(),
      getPostsFn(),
      getStatsFn(),
    ])
    return { user, posts, stats }
  },
})
```

### 4. Authentication & Session Management

Implement secure authentication flows with session management.

**When to use:**
- Setting up user authentication (login/logout/register)
- Implementing session management with cookies
- Protecting routes with authentication checks
- Managing user permissions and roles

**Key features:**
- HTTP-only, secure, SameSite cookies
- bcrypt password hashing (12+ salt rounds)
- Route protection with `beforeLoad`
- Session-based authentication

**Ready-to-use templates:**
- `assets/templates/auth-routes/_authed.tsx` - Protected layout
- `assets/templates/auth-routes/login.tsx` - Login page
- `assets/templates/auth-routes/auth.ts` - Auth server functions
- `assets/templates/auth-routes/session.ts` - Session configuration

**Latest patterns**: Search `"TanStack Start" authentication session 2025 site:tanstack.com`
**Additional reference**: See `references/implementation-patterns.md#認証パターン`

**Example - Session Setup:**
```tsx
export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',     // CSRF protection
      httpOnly: true,       // XSS protection
    },
  })
}
```

### 5. Environment Variables Management

Configure and secure environment variables across server and client contexts.

**When to use:**
- Setting up environment-specific configuration
- Managing API keys and secrets securely
- Configuring Cloudflare bindings
- Separating server-side and client-side variables

**Key principles:**
- **Server-side**: Access via `process.env` (all variables)
- **Client-side**: Access via `import.meta.env` (`VITE_` prefix only)
- **Security**: Never expose secrets to client (no `VITE_` prefix)

**Latest patterns**: Search `"TanStack Start" environment variables Vite 2025 site:tanstack.com`
**Additional reference**: See `references/implementation-patterns.md#環境変数管理`

**Example - Type-Safe Environment Variables:**
```typescript
// app/types/env.ts
export interface Env {
  // Server-only (no VITE_ prefix)
  SESSION_SECRET: string
  DATABASE_URL: string
  API_KEY: string

  // Client-exposed (VITE_ prefix required)
  VITE_APP_NAME: string
  VITE_API_BASE_URL: string
}

// Server function usage
export const getDataFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const apiKey = process.env.API_KEY // Server-only
    return fetchData(apiKey)
  })
```

## Best Practices

This skill includes comprehensive best practices covering performance, security, type safety, and error handling. Key principles:

- **Performance**: Minimize `beforeLoad` time, use parallel loaders, leverage TanStack Query for caching
- **Security**: Never expose secrets to client, validate all inputs, use HTTP-only cookies with bcrypt password hashing
- **Type Safety**: Leverage automatic type generation, use Zod for validation, define proper TypeScript interfaces
- **Error Handling**: Use appropriate error types (redirect/notFound/Error), implement boundaries, show user-friendly messages

**Complete guide with detailed examples and checklists**: See `references/best-practices.md`

## Working with This Skill

### Quick Reference Workflow

1. **Search official documentation first**
   - Use WebSearch: `"TanStack Start" <feature> 2025 site:tanstack.com`
   - Validate current API syntax and best practices
   - **Validation**: Confirm the official docs match this skill's patterns

2. **Identify the task type** (routing, server functions, data loading, auth, etc.)
   - **Validation**: Confirm task type based on verified functional requirements

3. **Consult implementation patterns** in `references/implementation-patterns.md`
   - **Validation**: Verify the selected pattern matches requirements and constraints
   - **Note**: Use as supplement, not replacement for official docs

4. **Use templates** from `assets/templates/` as starting points
   - **Validation**: Ensure templates are correctly copied and TODO comments are reviewed

5. **Follow best practices** from `references/best-practices.md`
   - **Validation**: Check security, performance, and type safety checklists are satisfied

6. **Adapt examples** to match project requirements
   - **Validation**: Verify implementation passes type checking and tests are executable

### When to Read References

Load reference documents into context when:
- Implementing specific patterns for the first time
- Needing detailed examples and explanations
- Troubleshooting complex implementations
- Understanding performance or security considerations

### Using Templates

Templates in `assets/templates/auth-routes/` provide production-ready authentication boilerplate:
- Copy templates to your project's `app/routes/` or `app/lib/` directories
- Replace TODO comments with actual database/business logic
- Customize UI components to match your design system
- Adjust validation schemas for your requirements

### Error Handling

If a pattern doesn't fit your use case:
1. **Fallback**: Consult the comprehensive guide in `references/` for alternative approaches
2. **Adaptation**: Modify patterns to match your specific requirements while maintaining type safety
3. **Validation**: Ensure security and performance best practices are preserved

If templates are missing required dependencies:
1. **Check**: Verify `package.json` includes `zod`, `bcryptjs`, `@tanstack/react-query`
2. **Install**: Run `bun add <missing-package>` or `npm install <missing-package>`
3. **Verify**: Ensure all imports resolve correctly and no type errors exist

## Code Review

This skill provides a specialized sub-agent for reviewing TanStack Start SPA implementations against best practices.

### Sub-agent: tanstack-start-spa-reviewer

**Purpose:** Review SPA code for compliance with routing patterns, Server Functions best practices, data loading strategies, authentication security, and environment variable management.

**When to use:**
- Reviewing completed SPA implementations
- Auditing security practices (auth, secrets, input validation)
- Checking performance optimizations (parallel loading, caching)
- Validating pattern compliance before deployment
- Troubleshooting issues with existing implementations

**How to invoke:**
Use the Task tool with `subagent_type='tanstack-start-spa-reviewer'` and specify files or directories to review.

**Example requests:**
- "Review my TanStack Start SPA implementation for best practices"
- "Check if my authentication follows SPA security patterns"
- "Audit my environment variables for security issues"
- "Review my data loading strategy for performance"

**Review output includes:**
- ✅ **Strengths**: Good practices observed
- ⚠️ **Warnings**: Non-critical issues with recommendations
- 🔴 **Critical Issues**: Security vulnerabilities, broken functionality
- 💡 **Recommendations**: Specific improvements with code examples
- 📚 **Reference Links**: Pointers to relevant patterns and templates

The reviewer evaluates implementations against:
- `references/implementation-patterns.md`
- `references/best-practices.md`
- `assets/templates/auth-routes/`

## Resources

### references/
- `implementation-patterns.md` - Comprehensive routing, server functions, data loading, authentication, and environment variable patterns
- `best-practices.md` - Performance, security, type safety, error handling, and code quality guidelines

### assets/templates/
- `auth-routes/_authed.tsx` - Protected route layout template
- `auth-routes/login.tsx` - Login page template
- `auth-routes/auth.ts` - Authentication server functions
- `auth-routes/session.ts` - Session configuration

### agents/
- `spa-reviewer.md` - Code review sub-agent for SPA implementations

Load references as needed to inform implementation. Use templates as production-ready starting points that require minimal customization.
