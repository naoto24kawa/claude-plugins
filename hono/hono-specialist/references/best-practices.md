# Hono Best Practices

Complete guide for building production-ready applications with Hono.

## Core Principles

### 1. Type Safety First

Hono provides excellent TypeScript support. Always leverage type inference and validation.

**Best Practice:**
```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

app.post('/users', zValidator('json', schema), (c) => {
  const data = c.req.valid('json') // Fully typed!
  return c.json({ success: true, data })
})
```

**Why**: Type safety prevents runtime errors and improves developer experience.

### 2. Middleware Composition

Use middleware to separate concerns and keep route handlers clean.

**Best Practice:**
```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors())

// Protected routes
app.use('/api/*', jwt({ secret: 'secret' }))

// Clean route handlers
app.get('/api/users', (c) => {
  // Handler only deals with business logic
  return c.json({ users: [] })
})
```

**Why**: Separation of concerns makes code maintainable and testable.

### 3. Proper Error Handling

Always handle errors gracefully and return appropriate status codes.

**Best Practice:**
```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Custom error class
class AppError extends HTTPException {
  constructor(status: number, message: string, details?: any) {
    super(status, { message })
    this.res = new Response(
      JSON.stringify({ error: message, details }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Route with error handling
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')

  const user = await db.getUser(id)
  if (!user) {
    throw new AppError(404, 'User not found', { userId: id })
  }

  return c.json(user)
})

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

**Why**: Clear error messages improve debugging and user experience.

## Routing Best Practices

### 1. RESTful API Design

Follow REST conventions for predictable APIs.

**Best Practice:**
```typescript
const app = new Hono()

// Resource-based routes
app.get('/api/users', listUsers)           // GET /api/users
app.post('/api/users', createUser)         // POST /api/users
app.get('/api/users/:id', getUser)         // GET /api/users/123
app.put('/api/users/:id', updateUser)      // PUT /api/users/123
app.delete('/api/users/:id', deleteUser)   // DELETE /api/users/123

// Nested resources
app.get('/api/users/:userId/posts', getUserPosts)
app.post('/api/users/:userId/posts', createUserPost)
```

**Why**: RESTful conventions make APIs intuitive and self-documenting.

### 2. Route Grouping

Use `Hono` instances to group related routes.

**Best Practice:**
```typescript
import { Hono } from 'hono'

// User routes
const users = new Hono()
users.get('/', listUsers)
users.post('/', createUser)
users.get('/:id', getUser)
users.put('/:id', updateUser)
users.delete('/:id', deleteUser)

// Post routes
const posts = new Hono()
posts.get('/', listPosts)
posts.post('/', createPost)

// Main app
const app = new Hono()
app.route('/api/users', users)
app.route('/api/posts', posts)
```

**Why**: Modular code is easier to maintain and test.

### 3. Path Parameters and Query Strings

Handle parameters correctly with proper validation.

**Best Practice:**
```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// Path parameters
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  // Validate id format
  if (!id.match(/^\d+$/)) {
    return c.json({ error: 'Invalid user ID' }, 400)
  }
  // ...
})

// Query parameters with validation
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  sort: z.enum(['asc', 'desc']).default('asc'),
})

app.get('/users', zValidator('query', querySchema), async (c) => {
  const { page, limit, sort } = c.req.valid('query')
  // Fully typed and validated!
  return c.json({ page, limit, sort })
})
```

**Why**: Validation prevents invalid data from entering your system.

## Middleware Best Practices

### 1. Built-in Middleware Usage

Leverage Hono's built-in middleware when possible.

**Available Middleware:**
```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'
import { etag } from 'hono/etag'
import { jwt } from 'hono/jwt'
import { basicAuth } from 'hono/basic-auth'
import { bearerAuth } from 'hono/bearer-auth'
import { cache } from 'hono/cache'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()

// Logger - development
app.use('*', logger())

// Security headers
app.use('*', secureHeaders())

// CORS
app.use('*', cors({
  origin: ['https://example.com'],
  credentials: true,
}))

// Compression
app.use('*', compress())

// ETag for caching
app.use('*', etag())

// JWT authentication
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET }))

// Bearer auth
app.use('/admin/*', bearerAuth({ token: process.env.ADMIN_TOKEN }))
```

**Why**: Built-in middleware is tested, optimized, and well-maintained.

### 2. Custom Middleware

Create reusable custom middleware for common patterns.

**Best Practice:**
```typescript
import { MiddlewareHandler } from 'hono'

// Request ID middleware
export const requestId = (): MiddlewareHandler => {
  return async (c, next) => {
    const id = crypto.randomUUID()
    c.set('requestId', id)
    c.res.headers.set('X-Request-ID', id)
    await next()
  }
}

// Timing middleware
export const timing = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start
    c.res.headers.set('X-Response-Time', `${duration}ms`)
  }
}

// Usage
app.use('*', requestId())
app.use('*', timing())
```

**Why**: Custom middleware encapsulates cross-cutting concerns.

### 3. Middleware Order

Apply middleware in the correct order.

**Best Practice:**
```typescript
const app = new Hono()

// 1. Logging (first, to log everything)
app.use('*', logger())

// 2. Security headers
app.use('*', secureHeaders())

// 3. CORS
app.use('*', cors())

// 4. Compression
app.use('*', compress())

// 5. Authentication (before protected routes)
app.use('/api/*', jwt({ secret: 'secret' }))

// 6. Routes
app.get('/api/users', getUsers)
```

**Why**: Order matters - some middleware depends on others.

## Validation Best Practices

### 1. Use Zod for Validation

Zod provides excellent TypeScript integration.

**Best Practice:**
```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// Define schemas
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older'),
  role: z.enum(['user', 'admin']).default('user'),
})

// Validate JSON body
app.post('/users', zValidator('json', userSchema), async (c) => {
  const data = c.req.valid('json') // Fully typed!
  const user = await createUser(data)
  return c.json(user, 201)
})

// Validate multiple sources
app.post(
  '/users/:id/profile',
  zValidator('param', z.object({ id: z.string() })),
  zValidator('json', profileSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const profile = c.req.valid('json')
    // ...
  }
)
```

**Why**: Type-safe validation catches errors early.

### 2. Reusable Schemas

Define schemas once and reuse them.

**Best Practice:**
```typescript
// schemas.ts
import { z } from 'zod'

export const schemas = {
  user: {
    create: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      password: z.string().min(8),
    }),
    update: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
    }),
    id: z.object({
      id: z.string().uuid(),
    }),
  },
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  }),
}

// routes.ts
import { schemas } from './schemas'

app.post('/users', zValidator('json', schemas.user.create), createUser)
app.patch('/users/:id',
  zValidator('param', schemas.user.id),
  zValidator('json', schemas.user.update),
  updateUser
)
```

**Why**: DRY principle - define validation logic once.

## Context Usage

### 1. Context Variables

Use `c.set()` and `c.get()` for passing data between middleware and handlers.

**Best Practice:**
```typescript
import { Hono } from 'hono'

type Variables = {
  userId: string
  user: User
  requestId: string
}

const app = new Hono<{ Variables: Variables }>()

// Middleware sets variables
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')
  const userId = await verifyToken(token)
  c.set('userId', userId)

  const user = await getUser(userId)
  c.set('user', user)

  await next()
})

// Handler uses variables (fully typed!)
app.get('/api/profile', (c) => {
  const user = c.get('user')
  return c.json(user)
})
```

**Why**: Type-safe context prevents runtime errors.

### 2. Response Helpers

Use context methods for consistent responses.

**Best Practice:**
```typescript
// JSON responses
app.get('/users', (c) => {
  return c.json({ users: [] })
})

// HTML responses
app.get('/page', (c) => {
  return c.html('<h1>Hello</h1>')
})

// Redirects
app.get('/old', (c) => {
  return c.redirect('/new', 301)
})

// Status codes
app.post('/users', async (c) => {
  const user = await createUser()
  return c.json(user, 201)
})

// Custom headers
app.get('/data', (c) => {
  return c.json({ data: [] }, 200, {
    'X-Custom-Header': 'value',
  })
})
```

**Why**: Consistent response handling improves maintainability.

## Performance Best Practices

### 1. Response Caching

Use caching for expensive operations.

**Best Practice:**
```typescript
import { cache } from 'hono/cache'

// Cache for 1 hour
app.get(
  '/api/static-data',
  cache({
    cacheName: 'static-data',
    cacheControl: 'max-age=3600',
  }),
  (c) => {
    return c.json({ data: expensiveOperation() })
  }
)
```

**Why**: Caching reduces server load and improves response times.

### 2. Streaming Responses

Use streaming for large responses.

**Best Practice:**
```typescript
app.get('/stream', (c) => {
  return c.streamText(async (stream) => {
    for (let i = 0; i < 10; i++) {
      await stream.write(`Chunk ${i}\n`)
      await stream.sleep(100)
    }
  })
})
```

**Why**: Streaming prevents memory issues with large data.

### 3. Database Connection Pooling

Reuse database connections across requests.

**Best Practice:**
```typescript
// db.ts
import { drizzle } from 'drizzle-orm/d1'

let db: ReturnType<typeof drizzle>

export const getDb = (env: any) => {
  if (!db) {
    db = drizzle(env.DB)
  }
  return db
}

// routes.ts
app.get('/users', async (c) => {
  const db = getDb(c.env)
  const users = await db.select().from(usersTable)
  return c.json(users)
})
```

**Why**: Connection pooling improves performance.

## Security Best Practices

### 1. Input Sanitization

Always validate and sanitize user input.

**Best Practice:**
```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

// Sanitize strings
const sanitizeString = (str: string) => {
  return str.trim().replace(/[<>]/g, '')
}

const schema = z.object({
  name: z.string().min(1).transform(sanitizeString),
  email: z.string().email(),
})

app.post('/users', zValidator('json', schema), createUser)
```

**Why**: Prevents XSS and injection attacks.

### 2. CORS Configuration

Configure CORS properly for security.

**Best Practice:**
```typescript
import { cors } from 'hono/cors'

// Production
app.use('*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))

// Development (more permissive)
if (process.env.NODE_ENV === 'development') {
  app.use('*', cors())
}
```

**Why**: Proper CORS prevents unauthorized cross-origin requests.

### 3. Rate Limiting

Implement rate limiting to prevent abuse.

**Best Practice:**
```typescript
// Simple rate limiter middleware
const rateLimiter = (limit: number, window: number): MiddlewareHandler => {
  const requests = new Map<string, number[]>()

  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - window

    const timestamps = requests.get(ip) || []
    const recentRequests = timestamps.filter(t => t > windowStart)

    if (recentRequests.length >= limit) {
      return c.json({ error: 'Rate limit exceeded' }, 429)
    }

    recentRequests.push(now)
    requests.set(ip, recentRequests)

    await next()
  }
}

// Apply rate limiting
app.use('/api/*', rateLimiter(100, 60000)) // 100 requests per minute
```

**Why**: Rate limiting prevents abuse and DDoS attacks.

## Testing Best Practices

### 1. Unit Testing Routes

Test routes with Hono's request/response mocks.

**Best Practice:**
```typescript
import { describe, it, expect } from 'vitest'
import { app } from './app'

describe('GET /users', () => {
  it('should return users', async () => {
    const res = await app.request('/users')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('users')
    expect(Array.isArray(data.users)).toBe(true)
  })

  it('should require authentication', async () => {
    const res = await app.request('/users', {
      headers: { Authorization: 'invalid' },
    })
    expect(res.status).toBe(401)
  })
})
```

**Why**: Tests ensure routes work as expected.

### 2. Middleware Testing

Test middleware in isolation.

**Best Practice:**
```typescript
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { timing } from './middleware'

describe('timing middleware', () => {
  it('should add response time header', async () => {
    const app = new Hono()
    app.use('*', timing())
    app.get('/', (c) => c.text('ok'))

    const res = await app.request('/')
    expect(res.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
  })
})
```

**Why**: Isolated tests are easier to debug.

## Common Anti-Patterns

### ❌ Not Using TypeScript

**Don't:**
```javascript
const app = new Hono()
app.post('/users', async (c) => {
  const data = await c.req.json() // Untyped!
  return c.json(data)
})
```

**Do:**
```typescript
const schema = z.object({ name: z.string() })
app.post('/users', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json') // Fully typed!
  return c.json(data)
})
```

### ❌ Mixing Concerns in Route Handlers

**Don't:**
```typescript
app.get('/users', async (c) => {
  // Authentication logic
  const token = c.req.header('Authorization')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)

  // Logging
  console.log('Fetching users')

  // Business logic
  const users = await db.getUsers()

  // Response formatting
  return c.json({ users })
})
```

**Do:**
```typescript
app.use('/api/*', authMiddleware())
app.use('*', logger())

app.get('/users', async (c) => {
  // Only business logic
  const users = await db.getUsers()
  return c.json({ users })
})
```

### ❌ Ignoring Error Handling

**Don't:**
```typescript
app.get('/users/:id', async (c) => {
  const user = await db.getUser(c.req.param('id'))
  return c.json(user) // What if user is null?
})
```

**Do:**
```typescript
app.get('/users/:id', async (c) => {
  const user = await db.getUser(c.req.param('id'))
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json(user)
})
```

### ❌ Not Validating Input

**Don't:**
```typescript
app.post('/users', async (c) => {
  const data = await c.req.json() // Unvalidated!
  await db.createUser(data)
  return c.json({ success: true })
})
```

**Do:**
```typescript
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

app.post('/users', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json') // Validated!
  await db.createUser(data)
  return c.json({ success: true })
})
```

## Environment-Specific Best Practices

### Cloudflare Workers

```typescript
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/data', async (c) => {
  const db = c.env.DB
  const kv = c.env.KV
  const bucket = c.env.BUCKET

  // Use Workers-specific APIs
  const data = await db.prepare('SELECT * FROM users').all()
  await kv.put('key', 'value')
  await bucket.put('file.txt', 'content')

  return c.json(data)
})

export default app
```

### Deno

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/deno'

const app = new Hono()

app.get('/', (c) => c.text('Hello Deno!'))

serve(app)
```

### Bun

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Bun!'))

export default {
  port: 3000,
  fetch: app.fetch,
}
```

### Node.js

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => c.text('Hello Node!'))

serve({
  fetch: app.fetch,
  port: 3000,
})
```
