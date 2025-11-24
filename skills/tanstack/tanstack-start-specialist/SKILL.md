---
name: tanstack-start-specialist
description: Specialist for TanStack Start framework development. Use when working with file-based routing, type-safe server functions (createServerFn), authentication, data loading strategies, or deploying to Cloudflare Workers/Pages. Triggered by queries about TanStack Start architecture, SSR, or full-stack React patterns.
---

# TanStack Start Specialist

## Overview

This skill provides comprehensive guidance for developing full-stack React applications with TanStack Start. TanStack Start is a modern framework built on TanStack Router and Vite, offering type-safe server functions, file-based routing, SSR, streaming, and universal deployment capabilities.

## Core Capabilities

### 1. Routing Architecture & Implementation

Design and implement file-based routing using TanStack Router conventions.

**Key concepts:**
- Use `createFileRoute` to define routes with automatic path management
- Organize routes in `src/routes/` directory
- Implement `__root.tsx` as the mandatory root route for document shell
- Create dynamic routes using `$paramName.tsx` naming convention
- Leverage nested routing for hierarchical component structures

**Common route patterns:**
- Index routes: `index.tsx` → `/`
- Static routes: `about.tsx` → `/about`
- Dynamic routes: `posts/$postId.tsx` → `/posts/:postId`
- Wildcard routes: `rest/$.tsx` → `/rest/*`

**Essential components:**
- `<Outlet />` - Render matching child routes
- `<HeadContent />` - Manage document head (meta, title)
- `<Scripts />` - Load client-side JavaScript

For the latest routing patterns, search official documentation: `"TanStack Start" routing 2025 site:tanstack.com`

### 2. Server Functions Development

Implement type-safe server-side logic that can be called from anywhere in the application.

**Basic pattern:**
```tsx
import { createServerFn } from '@tanstack/react-start'

// GET request
export const getData = createServerFn().handler(async () => {
  return { message: 'Hello from server!' }
})

// POST request with input validation
export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(UserSchema)
  .handler(async ({ data }) => {
    return { success: true, user: data }
  })
```

**Use cases:**
- Route loaders for data fetching
- Form submissions and mutations
- Authentication operations
- Database access and API integration

**Best practices:**
- Always validate inputs using Zod or similar schema validators
- Handle errors appropriately (throw Error, redirect, or notFound)
- Keep sensitive operations server-side only
- Use middleware for cross-cutting concerns

For the latest server function patterns, search: `"TanStack Start" createServerFn validation 2025 site:tanstack.com`

### 3. Data Loading Strategies

Optimize data fetching with loaders, prefetching, and caching strategies.

**Execution order:**
- `beforeLoad` functions run sequentially from parent to child
- `loader` functions run in parallel for optimal performance

**Integration with TanStack Query:**
- Use `prefetchQuery` for non-blocking requests
- Use `ensureQueryData` to block rendering until data is available
- Leverage `Promise.allSettled` to avoid waterfalls

**Preloading strategies:**
- Intent-based: Preload on hover/touch events
- Viewport-based: Preload when links enter viewport

**Performance considerations:**
- Slow `beforeLoad` functions block downstream routes
- Set `defaultPreloadStaleTime: 0` for external caching libraries
- Default preload freshness: 30 seconds

For the latest data loading patterns, search: `"TanStack Start" loader prefetch TanStack Query 2025 site:tanstack.com`

### 4. Authentication & Session Management

Implement secure authentication flows with session management.

**Session configuration:**
```typescript
export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true,
    },
  })
}
```

**Route protection pattern:**
```typescript
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { user }
  },
})
```

**Security best practices:**
- Use bcrypt with 12 salt rounds for password hashing
- Set `httpOnly: true` for XSS protection
- Set `sameSite: 'lax'` for CSRF protection
- Implement rate limiting to prevent brute-force attacks
- Validate all inputs with Zod or similar validators

For the latest authentication patterns, search: `"TanStack Start" authentication session security 2025 site:tanstack.com`

### 5. Environment Variables Management

Properly configure and secure environment variables across server and client contexts.

**Context separation:**
- **Server-side**: Access all variables via `process.env`
- **Client-side**: Only `VITE_` prefixed variables via `import.meta.env`

**File hierarchy (priority order):**
1. `.env.local` - Local overrides (gitignore recommended)
2. `.env.production` - Production-specific
3. `.env.development` - Development-specific
4. `.env` - Defaults (commit to repository)

**Security rules:**
- Never expose secrets to client - no `VITE_` prefix for sensitive data
- Store API keys, database URLs server-side only
- Access secrets exclusively within server functions
- Restart server after environment changes

For the latest environment variable guidance, search: `"TanStack Start" environment variables Vite 2025 site:tanstack.com`

### 6. Deployment to Cloudflare Workers/Pages

Deploy TanStack Start applications to Cloudflare's edge network.

**Setup steps:**

1. Install dependencies:
```bash
pnpm add -D @cloudflare/vite-plugin wrangler
```

2. Create `wrangler.jsonc`:
```json
{
  "compatibility_date": "YYYY-MM-DD",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

**Note**: Replace `YYYY-MM-DD` with a recent date or desired compatibility date (e.g., 2025-01-15).

3. Add scripts to `package.json`:
```json
{
  "scripts": {
    "deploy": "wrangler pages deploy .output/public",
    "preview": "wrangler pages dev .output/public",
    "cf-typegen": "wrangler types"
  }
}
```

4. Deploy:
```bash
npx wrangler login
pnpm run deploy
```

**Bindings integration:**
- Import environment from `cloudflare:workers`
- Run `cf-typegen` for automatic type generation
- Access KV, R2, D1, AI, and other Cloudflare services

**Known issues:**
- Environment bindings may not be accessible in SSR pipeline
- Workaround: Use bindings in API routes or server functions

For deployment to other platforms, search: `"TanStack Start" deployment <platform> 2025 site:tanstack.com`

## Usage Guidelines

### When to Use This Skill

Activate this skill when encountering:
- TanStack Start project setup or architecture questions
- File-based routing configuration
- Server function implementation or debugging
- Data loading optimization with loaders/TanStack Query
- Authentication flow implementation
- Environment variable configuration issues
- Deployment to Cloudflare Workers/Pages
- Type safety concerns across client-server boundary
- SSR, streaming, or performance optimization

### Working with Official Documentation

**CRITICAL**: Always verify information against the latest official TanStack Start documentation before providing guidance. This skill's patterns may become outdated as TanStack Start evolves.

**Documentation Reference Workflow:**

1. **For ANY implementation question**, first search the official documentation using WebSearch:
   - Search query format: `"TanStack Start" <specific feature> site:tanstack.com`
   - Example: `"TanStack Start" server functions site:tanstack.com`

2. **For the latest API references and features**, use WebFetch to retrieve current documentation:
   - Official docs: https://tanstack.com/router/latest/docs/framework/react/start
   - Use the fetched content to validate/update this skill's patterns

3. **When patterns in this skill conflict with official docs**, prioritize official documentation

**When to search official documentation:**
- Before implementing any feature (verify current best practices)
- When encountering errors or unexpected behavior
- For API syntax and configuration options
- When the skill's patterns seem outdated or incomplete
- For platform-specific deployment guidance

**Recommended search queries:**
- Latest routing patterns: `"TanStack Start" file-based routing 2025 site:tanstack.com`
- Server Functions: `"TanStack Start" createServerFn latest site:tanstack.com`
- Data loading: `"TanStack Start" loader beforeLoad latest site:tanstack.com`
- Authentication: `"TanStack Start" authentication session latest site:tanstack.com`
- Deployment: `"TanStack Start" Cloudflare deployment latest site:tanstack.com`

**Documentation verification checklist:**
- [ ] Search official docs for the feature being implemented
- [ ] Compare official patterns with this skill's guidance
- [ ] Use the most recent API syntax from official docs
- [ ] Verify configuration options are current
- [ ] Check for deprecation warnings or breaking changes

## Best Practices

### Code Organization

- Organize routes in `src/routes/` following TanStack Router conventions
- Keep server functions in dedicated files or colocated with routes
- Separate concerns: authentication, data fetching, business logic
- Use TypeScript for end-to-end type safety

### Performance

- Implement proper preloading strategies (intent-based, viewport-based)
- Minimize `beforeLoad` execution time to avoid blocking child routes
- Use parallel loaders for independent data fetching
- Leverage TanStack Query for caching and deduplication

### Security

- Never expose secrets to client (no `VITE_` prefix)
- Always validate inputs in server functions
- Use HTTP-only, secure, SameSite cookies for sessions
- Implement rate limiting and CSRF protection
- Hash passwords with bcrypt (12+ salt rounds)

### Type Safety

- Leverage TanStack Router's automatic type generation
- Use Zod or similar validators for runtime validation
- Define proper TypeScript interfaces for server function I/O
- Run `cf-typegen` for Cloudflare bindings types

## Keeping This Skill Current

**Important**: This skill's patterns are based on TanStack Start as of the last update. Always validate against the latest official documentation.

### Recommended Update Process

When using this skill:
1. Search official docs for the feature you're implementing
2. If official docs show different patterns, use the official version
3. Report outdated patterns in this skill for future updates

### Common Update Areas

Features that frequently change:
- Server Functions API syntax (`createServerFn` options)
- Deployment configurations (Cloudflare, Netlify adapters)
- Authentication patterns (session management libraries)
- Routing conventions (file-based routing rules)
- Environment variable handling

### Staying Current

Regularly check these resources:
- Official changelog: https://tanstack.com/router/latest/docs/framework/react/start/changelog
- Migration guides: Search `"TanStack Start" migration guide site:tanstack.com`
- GitHub releases: https://github.com/TanStack/router/releases

## Code Review Agent

This skill also provides the **tanstack-start-reviewer** sub-agent for evaluating code compliance with TanStack Start best practices:

### Review Capabilities

**File Structure & Routing**
- Verify routes follow file-based conventions
- Check `__root.tsx` configuration
- Validate dynamic route syntax (`$paramName`)
- Ensure proper use of `createFileRoute`

**Server Functions**
- Input validation presence (Zod, Valibot, etc.)
- Error handling completeness
- Type safety across server-client boundary
- Secrets protection (server-side only)

**Security**
- Authentication checks on protected routes
- Environment variable segregation
- Session configuration (HTTP-only, SameSite, secure)
- Input sanitization and validation
- Rate limiting on sensitive endpoints

**Performance**
- Data loading optimization (parallel vs sequential)
- Prefetching strategy evaluation
- `beforeLoad` performance impact
- Caching strategy assessment

**Type Safety**
- TypeScript strict mode compliance
- Elimination of `any` types
- Proper type definitions for server functions
- Generated route types utilization

**Deployment**
- Platform configuration (Cloudflare, Netlify)
- Build output correctness
- Environment variable setup

### How to Invoke

Use the Task tool with `subagent_type='tanstack-start-reviewer'` and specify files or directories to review.

**Example requests:**
- "Review my TanStack Start implementation for best practices"
- "Check if my server functions follow TanStack Start patterns"
- "Review authentication implementation for security issues"
- "Analyze my routing structure for compliance"

### Review Output Format

The reviewer provides:
- ✅ **Strengths**: Good practices observed
- ⚠️ **Warnings**: Non-critical issues with recommendations
- 🔴 **Critical Issues**: Security, correctness, or architectural problems
- 💡 **Recommendations**: Suggestions for improvement
- 📝 **Specific Fixes**: Before/after code examples

### Priority Levels

- 🔴 **Critical**: Security vulnerabilities, broken functionality
- 🟠 **High**: Performance issues, type safety violations
- 🟡 **Medium**: Best practice violations, code organization
- 🟢 **Low**: Style, minor optimizations

Use the code review agent after implementing features or when preparing for production deployment to ensure TanStack Start best practices compliance.
