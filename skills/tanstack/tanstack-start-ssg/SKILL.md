---
name: tanstack-start-ssg
description: Implement Static Site Generation (SSG) in TanStack Start projects using prerendering. Use when building static sites, blogs, documentation sites, or applications requiring SEO optimization and fast initial page load. Applies to vite.config.ts configuration, deployment setup, and troubleshooting SSG-related issues.
---

# TanStack Start SSG Implementation

## Overview

Implement Static Site Generation (SSG) for TanStack Start projects through static prerendering. This skill provides configuration patterns, best practices, and troubleshooting guidance for generating static HTML files at build time to improve performance, SEO, and enable deployment to static hosting platforms.

**CRITICAL**: Always verify SSG configuration against the latest official TanStack Start documentation. Prerendering APIs and configuration options may change between versions. Use WebSearch with `"TanStack Start" prerender vite.config 2025 site:tanstack.com` before implementing.

**Related Sub-agent:** This skill works in conjunction with the `tanstack-start-ssg-reviewer` sub-agent, which specializes in reviewing existing SSG configurations. Use the skill for implementation and the sub-agent for reviewing and validating your vite.config.ts prerender settings.

## Initial Setup: Version Detection

**MANDATORY FIRST STEP**: Detect TanStack Start version before providing SSG guidance:

```bash
# Check package.json for version
cat package.json | grep -A 2 "@tanstack/react-start"
```

**Version-specific prerender API documentation:**
- v1.x: `https://tanstack.com/router/v1/docs/framework/react/start/guide/static-prerendering`
- Latest: `https://tanstack.com/router/latest/docs/framework/react/start/guide/static-prerendering`

**Version-specific actions:**

1. **Version detected (e.g., v1.80.3)**:
   - Use version-specific prerender documentation
   - Search: `"TanStack Start" prerender v{major}.{minor} site:tanstack.com`
   - Example: `"TanStack Start" prerender v1.80 site:tanstack.com`
   - Inform user: "Using TanStack Start v1.80 prerender patterns"

2. **No package.json or version unknown**:
   - Assume latest version
   - Use latest prerender documentation
   - Notify: "Using latest TanStack Start prerender patterns. Install from package.json if different version needed."

3. **Version < v1.60**:
   - **Critical warning**: Prerender API significantly changed in v1.60+
   - Recommend upgrade or check version-specific migration guide
   - Search: `"TanStack Start" prerender migration v{old} site:tanstack.com`

4. **Version notes for SSG**:
   - v1.121+: Use `vite.config.ts` (app.config.ts deprecated)
   - v1.60-1.120: Either `app.config.ts` or `vite.config.ts`
   - v1.0-1.59: Use `app.config.ts`

**Version verification checklist:**
- [ ] package.json checked for @tanstack/react-start version
- [ ] Version-appropriate prerender documentation URL selected
- [ ] User informed of which version's SSG patterns are being used
- [ ] Migration warnings issued if necessary

## When to Use This Skill

Activate this skill when:
- Implementing SSG/prerendering in TanStack Start projects
- Configuring `vite.config.ts` for static site generation
- Building blogs, documentation sites, or marketing websites
- Optimizing SEO and initial page load performance
- Deploying to Cloudflare Pages, Netlify, or other static hosts
- Troubleshooting prerendering issues or build failures
- Converting existing SSR applications to static sites

**For Configuration Review:** Use the `tanstack-start-ssg-reviewer` sub-agent to review and validate existing SSG configurations against best practices.

## Core Workflow

### Step 1: Identify Project Requirements

Determine the appropriate SSG approach based on project characteristics:

**Pattern Selection:**
- **Small sites (<50 pages)**: Use Pattern 1 (Full Auto + Crawl Links)
- **Medium sites (50-500 pages)**: Use Pattern 2 (SPA + Selective Prerender) or Pattern 3 (Individual Page Specification)
- **Blogs/Content sites**: Use Pattern 4 (Blog Optimization)
- **Multi-language sites**: Use Pattern 5 (i18n)
- **Existing SSR migration**: Use Pattern 6 (Gradual Adoption)

**Key Questions:**
- How many pages need to be static?
- Are there dynamic routes (e.g., `/posts/$slug`)?
- Is authentication required?
- What are the SEO requirements?
- Which deployment platform is being used?

**Verification:**
- [ ] Project requirements are clearly documented
- [ ] Appropriate pattern selected based on site size and complexity
- [ ] Deployment platform identified

### Step 2: Configure vite.config.ts

**Before configuring**, search for the latest prerender API:
- WebSearch: `"TanStack Start" prerender configuration 2025 site:tanstack.com`
- Verify the configuration options match official documentation

Apply the appropriate configuration pattern. Reference `references/implementation-patterns.md` for detailed examples of each pattern (but prioritize official docs if they differ).

**Basic Configuration Template:**

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: true,
        crawlLinks: true,
        concurrency: 14,
        retryCount: 2,
        retryDelay: 1000,
        failOnError: true,
      },
    }),
    viteReact(),
  ],
})
```

**Configuration Options Reference:**

**Latest official docs**: Search `"TanStack Start" prerender options API 2025 site:tanstack.com`

For additional reference, consult `references/configuration-options.md`. Key options include:

- `enabled`: Enable/disable prerendering
- `autoStaticPathsDiscovery`: Auto-detect static routes
- `crawlLinks`: Extract and prerender linked pages
- `concurrency`: Number of parallel prerender jobs
- `filter`: Function to control which paths to prerender
- `pages`: Array for individual page configuration

**Verification:**
- [ ] vite.config.ts syntax is valid (no TypeScript errors)
- [ ] tanstackStart plugin is properly configured
- [ ] Configuration builds successfully: `bun run build`

### Step 3: Handle Dynamic Routes

Dynamic routes (e.g., `/posts/$slug`) require special handling as they are not auto-detected.

**Solution 1: Use crawlLinks**

Create an index page that links to all dynamic routes:

```tsx
// app/routes/blog.tsx
export default function BlogIndex() {
  const posts = [
    { slug: 'first-post', title: 'First Post' },
    { slug: 'second-post', title: 'Second Post' },
  ]

  return (
    <div>
      {posts.map(post => (
        <Link to={`/blog/${post.slug}`} key={post.slug}>
          {post.title}
        </Link>
      ))}
    </div>
  )
}
```

Configure crawlLinks:
```typescript
tanstackStart({
  prerender: {
    enabled: true,
    crawlLinks: true,
  },
  pages: [
    { path: '/blog', prerender: { enabled: true } },
  ],
})
```

**Solution 2: Explicit Page Specification**

```typescript
const posts = await getPostSlugs()

tanstackStart({
  prerender: {
    enabled: true,
  },
  pages: [
    ...posts.map(slug => ({
      path: `/blog/${slug}`,
      prerender: { enabled: true },
    })),
  ],
})
```

**Verification:**
- [ ] Dynamic routes are properly configured (either crawlLinks or explicit specification)
- [ ] Index pages contain links to all dynamic routes (if using crawlLinks)
- [ ] Build generates HTML files for dynamic routes: check `.output/public`

### Step 4: Optimize Build Performance

Monitor and optimize build time using appropriate settings.

**Increase Concurrency:**
```typescript
prerender: {
  concurrency: 20, // Adjust based on CPU cores
}
```

**Filter Unnecessary Pages:**
```typescript
prerender: {
  filter: ({ path }) => {
    // Exclude API endpoints
    if (path.startsWith('/api/')) return false
    // Exclude user dashboards
    if (path.startsWith('/dashboard')) return false
    return true
  },
}
```

**Add Progress Logging:**
```typescript
prerender: {
  onSuccess: ({ page }) => {
    console.log(`✓ ${page.path}`)
  },
}
```

**Verification:**
- [ ] Build time is acceptable (typically < 10 minutes for CI/CD)
- [ ] Progress logs confirm pages are being rendered
- [ ] Filter excludes unnecessary pages (check output directory)

### Step 5: Configure for Deployment Platform

Apply platform-specific configuration.

**Cloudflare Pages:**
```typescript
tanstackStart({
  target: 'cloudflare-module',
  prerender: {
    enabled: true,
    autoSubfolderIndex: true,
    crawlLinks: true,
  },
})
```

**Netlify:**
```typescript
import { netlify } from '@netlify/vite-plugin-tanstack-start'

tanstackStart({
  prerender: {
    enabled: true,
    crawlLinks: true,
  },
})
```

**Verification:**
- [ ] Platform-specific target is set correctly (e.g., `cloudflare-module`)
- [ ] Platform-specific plugins are installed and configured
- [ ] Required platform configuration files exist (e.g., `wrangler.toml`)

### Step 6: Verify and Test

Run build and verify output:

```bash
bun run build
ls .output/public
```

**Verification Checklist:**
- [ ] `.output/public` directory contains HTML files
- [ ] Important pages are generated
- [ ] Build completes without errors
- [ ] Preview works: `bun run preview`

### Step 7: Review Configuration (Recommended)

After implementing your SSG configuration, use the `tanstack-start-ssg-reviewer` sub-agent for a comprehensive review:

```bash
/agent tanstack-start-ssg-reviewer
```

**The sub-agent will:**
- Validate your vite.config.ts against best practices
- Verify pattern selection is appropriate for your project size
- Check dynamic route handling implementation
- Assess performance optimization settings
- Identify security concerns or misconfigurations
- Provide actionable recommendations with priority levels

**Review Benefits:**
- Catch configuration errors before production deployment
- Optimize build performance based on project characteristics
- Ensure security best practices are followed
- Validate platform-specific settings
- Get expert recommendations for improvements

See the [Configuration Review](#configuration-review) section for detailed information on the sub-agent's capabilities.

## Troubleshooting

For detailed troubleshooting guidance, consult `references/troubleshooting-best-practices.md`.

### Common Mistakes

**❌ Bad: Including secrets in prerendered output**
```typescript
// DON'T: Secrets will be exposed in static HTML
prerender: {
  onSuccess: ({ page }) => {
    const apiKey = process.env.SECRET_API_KEY // Exposed!
    console.log(`Rendered with ${apiKey}`)
  }
}
```

**✅ Good: Use Server Functions for secrets**
```typescript
// DO: Keep secrets server-side only
import { createServerFn } from '@tanstack/react-start'

const fetchData = createServerFn('GET', async () => {
  const apiKey = process.env.SECRET_API_KEY // Server-side only
  return fetch('https://api.example.com', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
})
```

**❌ Bad: Using client-side only code in prerender**
```typescript
// DON'T: Browser APIs not available during prerender
export default function MyPage() {
  const data = localStorage.getItem('data') // Error during build!
  return <div>{data}</div>
}
```

**✅ Good: Check for browser environment**
```typescript
// DO: Safely handle SSG environment
export default function MyPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setData(localStorage.getItem('data'))
    }
  }, [])

  return <div>{data || 'Loading...'}</div>
}
```

### Common Issues

1. **Dynamic routes not prerendered**
   - Enable `crawlLinks` and create index pages with links
   - Or explicitly specify pages in `pages` array

2. **Build takes too long**
   - Increase `concurrency`
   - Use `filter` to exclude unnecessary pages
   - Consider gradual adoption pattern

3. **Specific page fails**
   - Check error logs
   - Temporarily exclude with `filter`
   - Ensure server-only code uses Server Functions

4. **Environment variables undefined**
   - Use `VITE_` prefix for client-side variables
   - Define defaults for missing variables
   - Use `vite.config.ts` `define` option

## Implementation Patterns

**Before using these patterns**, verify against official documentation:
- Search: `"TanStack Start" prerender patterns examples 2025 site:tanstack.com`
- Official patterns should take precedence over this skill's examples

The skill includes 6 core implementation patterns. Refer to `references/implementation-patterns.md` for complete examples and use cases (supplementary to official docs):

1. **Full Auto + Crawl Links** - Simple configuration for small sites
2. **SPA + Selective Prerender** - Hybrid approach for mixed content
3. **Individual Page Specification** - Fine-grained control for medium sites
4. **Blog Optimization** - Specialized for content-heavy sites
5. **Multi-language (i18n)** - Configuration for internationalized sites
6. **Gradual Adoption** - Phased migration from SSR to SSG

## Best Practices

**Always check official best practices first**:
- Search: `"TanStack Start" SSG best practices 2025 site:tanstack.com`

Core principles (verify against official docs):
1. **Start Small**: Begin with critical pages only, expand gradually
2. **Monitor Build Time**: Keep builds under 10 minutes for CI/CD efficiency
3. **Use Filter Wisely**: Exclude dynamic/authenticated pages
4. **Handle Errors**: Set `failOnError: true` for production builds
5. **Test Locally**: Always verify with `bun run preview` before deploying
6. **Version Control**: Track `.output/public` generation in CI logs
7. **Documentation First**: Always consult latest official docs before implementing

## Resources

This skill includes comprehensive reference documentation:

### references/implementation-patterns.md
Detailed implementation patterns with complete code examples for:
- Pattern 1: Full Auto + Crawl Links
- Pattern 2: SPA + Selective Prerender
- Pattern 3: Individual Page Specification
- Pattern 4: Blog Optimization
- Pattern 5: Multi-language (i18n)
- Pattern 6: Gradual Adoption
- Performance optimization patterns
- Platform-specific configurations

### references/configuration-options.md
Complete reference for all configuration options including:
- `prerender` object options
- `pages` array configuration
- `spa` object settings
- `sitemap` generation
- Full configuration examples
- Debugging tips

### references/troubleshooting-best-practices.md
Solutions for common issues and best practices including:
- 7 common problems and solutions
- Performance optimization strategies
- CI/CD integration examples
- Security best practices
- Testing strategies
- Pre-deployment checklist

## Quick Start Example

For a typical blog site:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: true,
        concurrency: 10,
        onSuccess: ({ page }) => {
          console.log(`✓ ${page.path}`)
        },
      },
      pages: [
        { path: '/', prerender: { enabled: true } },
        { path: '/blog', prerender: { enabled: true } },
        { path: '/about', prerender: { enabled: true } },
      ],
    }),
    viteReact(),
  ],
})
```

Build and deploy:
```bash
bun run build
bunx wrangler pages deploy .output/public
```

## Configuration Review

After implementing SSG configuration, use the `tanstack-start-ssg-reviewer` sub-agent to validate your setup:

**Sub-agent Capabilities:**
- Reviews vite.config.ts prerender configuration against best practices
- Evaluates pattern appropriateness for project size and complexity
- Validates dynamic route handling strategies
- Assesses performance optimization settings
- Checks deployment platform compatibility
- Provides prioritized, actionable recommendations with grades (A-F)

**How to Use:**
```bash
# Launch the reviewer sub-agent
/agent tanstack-start-ssg-reviewer

# The agent will:
1. Read your vite.config.ts
2. Analyze project structure for dynamic routes
3. Evaluate configuration against 6 review criteria
4. Generate detailed report with specific improvements
5. Provide example improved configuration if needed
```

**Review Criteria:**
1. Configuration Correctness - Syntax, required settings, TypeScript compatibility
2. Pattern Appropriateness - Pattern selection for site size and complexity
3. Dynamic Route Handling - crawlLinks and explicit page specification
4. Performance Optimization - Concurrency, filters, build time
5. Security & Best Practices - Secrets exposure, browser API usage
6. Platform Compatibility - Target settings, output structure

The sub-agent provides read-only analysis and recommendations without modifying your configuration files.

## Additional Notes

- **Version Compatibility**: Configuration format changed in v1.121 (app.config.ts deprecated, use vite.config.ts)
- **Known Issues**: Cloudflare environment bindings may not be accessible in SSR pipeline
- **Performance**: Default concurrency of 14 is optimized for standard CI environments
- **SEO**: Prerendered pages provide optimal SEO as they are served as static HTML

Refer to the bundled reference files for in-depth guidance on any aspect of TanStack Start SSG implementation.
