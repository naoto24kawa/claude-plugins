# Hono Middleware Guide

Complete guide for using and creating middleware in Hono.

## Built-in Middleware

### Logger

Logs request and response information.

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'

const app = new Hono()
app.use('*', logger())

// Output:
// <-- GET /api/users
// --> GET /api/users 200 12ms
```

### CORS

Enable Cross-Origin Resource Sharing.

```typescript
import { cors } from 'hono/cors'

// Simple usage (allow all origins)
app.use('*', cors())

// Custom configuration
app.use('*', cors({
  origin: ['https://example.com', 'https://app.example.com'],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['X-Total-Count'],
  maxAge: 600,
}))

// Dynamic origin
app.use('*', cors({
  origin: (origin) => {
    return origin.endsWith('.example.com') ? origin : 'https://example.com'
  },
}))
```

### JWT Authentication

```typescript
import { jwt } from 'hono/jwt'

// Protect all /api routes
app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET!,
}))

// Access JWT payload in handlers
app.get('/api/profile', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ user: payload })
})

// Custom token extraction
app.use('/api/*', jwt({
  secret: process.env.JWT_SECRET!,
  cookie: 'auth_token', // Read from cookie instead of header
}))
```

### Bearer Auth

Simple bearer token authentication.

```typescript
import { bearerAuth } from 'hono/bearer-auth'

app.use('/admin/*', bearerAuth({
  token: process.env.ADMIN_TOKEN!,
}))

// Multiple tokens
app.use('/admin/*', bearerAuth({
  token: [
    process.env.ADMIN_TOKEN_1!,
    process.env.ADMIN_TOKEN_2!,
  ],
}))

// Custom validation
app.use('/admin/*', bearerAuth({
  verifyToken: async (token, c) => {
    return await verifyTokenInDatabase(token)
  },
}))
```

### Basic Auth

HTTP Basic Authentication.

```typescript
import { basicAuth } from 'hono/basic-auth'

app.use('/admin/*', basicAuth({
  username: 'admin',
  password: 'secret',
}))

// Multiple users
app.use('/admin/*', basicAuth({
  verifyUser: (username, password, c) => {
    return username === 'admin' && password === 'secret'
  },
}))
```

### Compress

Compress responses using gzip or deflate.

```typescript
import { compress } from 'hono/compress'

// Default (gzip, deflate, br)
app.use('*', compress())

// Custom encoding
app.use('*', compress({
  encoding: 'gzip',
}))
```

### ETag

Add ETag header for caching.

```typescript
import { etag } from 'hono/etag'

app.use('*', etag())

// Weak ETags
app.use('*', etag({ weak: true }))
```

### Cache

Response caching middleware.

```typescript
import { cache } from 'hono/cache'

// Cache for 1 hour
app.get('/api/data', cache({
  cacheName: 'api-data',
  cacheControl: 'max-age=3600',
}), (c) => {
  return c.json({ data: 'expensive operation' })
})
```

### Secure Headers

Add security-related headers.

```typescript
import { secureHeaders } from 'hono/secure-headers'

app.use('*', secureHeaders())

// Custom configuration
app.use('*', secureHeaders({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
  },
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
}))
```

### Pretty JSON

Format JSON responses for readability.

```typescript
import { prettyJSON } from 'hono/pretty-json'

app.use('*', prettyJSON())

// Only in development
if (process.env.NODE_ENV === 'development') {
  app.use('*', prettyJSON())
}
```

### Trailing Slash

Handle trailing slashes in URLs.

```typescript
import { trimTrailingSlash } from 'hono/trailing-slash'

// Remove trailing slashes
app.use('*', trimTrailingSlash())
```

### Timeout

Set request timeout.

```typescript
import { timeout } from 'hono/timeout'

// 5 second timeout
app.use('*', timeout(5000))

// Custom timeout handler
app.use('*', timeout(5000, async (c) => {
  return c.json({ error: 'Request timeout' }, 504)
}))
```

## Custom Middleware

### Basic Custom Middleware

```typescript
import { MiddlewareHandler } from 'hono'

const myMiddleware: MiddlewareHandler = async (c, next) => {
  console.log('Before request')
  await next()
  console.log('After request')
}

app.use('*', myMiddleware)
```

### Request ID Middleware

```typescript
const requestId = (): MiddlewareHandler => {
  return async (c, next) => {
    const id = crypto.randomUUID()
    c.set('requestId', id)
    c.res.headers.set('X-Request-ID', id)
    await next()
  }
}

app.use('*', requestId())
```

### Timing Middleware

```typescript
const timing = (): MiddlewareHandler => {
  return async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start
    c.res.headers.set('X-Response-Time', `${duration}ms`)
  }
}

app.use('*', timing())
```

### Error Handling Middleware

```typescript
const errorHandler = (): MiddlewareHandler => {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      console.error('Error:', error)

      if (error instanceof HTTPException) {
        return error.getResponse()
      }

      return c.json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500)
    }
  }
}

app.use('*', errorHandler())
```

### Authentication Middleware

```typescript
const requireAuth = (): MiddlewareHandler => {
  return async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return c.json({ error: 'No token provided' }, 401)
    }

    try {
      const payload = await verifyJWT(token)
      c.set('user', payload)
      await next()
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401)
    }
  }
}

app.use('/api/*', requireAuth())
```

### Rate Limiting Middleware

```typescript
const rateLimiter = (limit: number, windowMs: number): MiddlewareHandler => {
  const requests = new Map<string, number[]>()

  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    const timestamps = requests.get(ip) || []
    const recentRequests = timestamps.filter(t => t > windowStart)

    if (recentRequests.length >= limit) {
      return c.json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((recentRequests[0] + windowMs - now) / 1000),
      }, 429)
    }

    recentRequests.push(now)
    requests.set(ip, recentRequests)

    await next()
  }
}

// 100 requests per minute
app.use('/api/*', rateLimiter(100, 60000))
```

### Validation Middleware

```typescript
import { z } from 'zod'

const validateRequest = <T extends z.ZodType>(
  schema: T,
  source: 'json' | 'query' | 'param' = 'json'
): MiddlewareHandler => {
  return async (c, next) => {
    let data: any

    if (source === 'json') {
      data = await c.req.json()
    } else if (source === 'query') {
      data = c.req.query()
    } else {
      data = c.req.param()
    }

    const result = schema.safeParse(data)

    if (!result.success) {
      return c.json({
        error: 'Validation failed',
        details: result.error.errors,
      }, 400)
    }

    c.set('validated', result.data)
    await next()
  }
}

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

app.post('/users', validateRequest(userSchema), (c) => {
  const data = c.get('validated')
  return c.json(data)
})
```

### Caching Middleware

```typescript
const cache = <T>(ttl: number): MiddlewareHandler => {
  const store = new Map<string, { data: T; expires: number }>()

  return async (c, next) => {
    const key = c.req.url
    const cached = store.get(key)

    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data)
    }

    await next()

    // Store response in cache
    const response = c.res.clone()
    const data = await response.json()
    store.set(key, {
      data,
      expires: Date.now() + ttl,
    })
  }
}

app.get('/api/data', cache(60000), getData) // Cache for 1 minute
```

## Middleware Patterns

### Conditional Middleware

```typescript
const conditionalMiddleware = (
  condition: (c: Context) => boolean,
  middleware: MiddlewareHandler
): MiddlewareHandler => {
  return async (c, next) => {
    if (condition(c)) {
      return middleware(c, next)
    }
    await next()
  }
}

// Only log in development
app.use('*', conditionalMiddleware(
  () => process.env.NODE_ENV === 'development',
  logger()
))
```

### Async Middleware

```typescript
const asyncMiddleware: MiddlewareHandler = async (c, next) => {
  // Async operations before handler
  const user = await fetchUser(c.req.header('user-id'))
  c.set('user', user)

  await next()

  // Async operations after handler
  await logActivity(user.id, c.req.path)
}
```

### Factory Pattern

```typescript
const createAuthMiddleware = (options: {
  secret: string
  algorithm?: 'HS256' | 'RS256'
}): MiddlewareHandler => {
  return async (c, next) => {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    try {
      const payload = await jwt.verify(token, options.secret, {
        algorithm: options.algorithm || 'HS256',
      })
      c.set('user', payload)
      await next()
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401)
    }
  }
}

// Usage
app.use('/api/*', createAuthMiddleware({
  secret: process.env.JWT_SECRET!,
  algorithm: 'HS256',
}))
```

### Composing Multiple Middleware

```typescript
const compose = (...middlewares: MiddlewareHandler[]): MiddlewareHandler => {
  return async (c, next) => {
    let index = 0

    const dispatch = async (): Promise<void> => {
      if (index >= middlewares.length) {
        return next()
      }

      const middleware = middlewares[index++]
      await middleware(c, dispatch)
    }

    await dispatch()
  }
}

// Usage
const apiMiddleware = compose(
  logger(),
  timing(),
  requireAuth(),
  rateLimiter(100, 60000)
)

app.use('/api/*', apiMiddleware)
```

## Middleware Order

The order in which middleware is applied matters:

```typescript
const app = new Hono()

// 1. Logging (first, to log everything)
app.use('*', logger())

// 2. Error handling (catch all errors)
app.use('*', errorHandler())

// 3. Security headers
app.use('*', secureHeaders())

// 4. CORS
app.use('*', cors())

// 5. Compression
app.use('*', compress())

// 6. Authentication (before protected routes)
app.use('/api/*', requireAuth())

// 7. Rate limiting (after auth to limit per user)
app.use('/api/*', rateLimiter(100, 60000))

// 8. Routes
app.get('/api/users', getUsers)
```

## TypeScript with Middleware

### Typed Variables

```typescript
type Variables = {
  user: {
    id: string
    email: string
  }
  requestId: string
}

const app = new Hono<{ Variables: Variables }>()

const authMiddleware: MiddlewareHandler = async (c, next) => {
  const user = await authenticateUser(c.req.header('Authorization'))
  c.set('user', user) // Type-safe!
  await next()
}

app.use('/api/*', authMiddleware)

app.get('/api/profile', (c) => {
  const user = c.get('user') // Fully typed!
  return c.json(user)
})
```

### Generic Middleware

```typescript
interface CacheOptions {
  ttl: number
  keyGenerator?: (c: Context) => string
}

const createCache = <T>(options: CacheOptions): MiddlewareHandler => {
  const store = new Map<string, { data: T; expires: number }>()

  return async (c, next) => {
    const key = options.keyGenerator?.(c) || c.req.url
    const cached = store.get(key)

    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data)
    }

    await next()

    if (c.res.status === 200) {
      const data = await c.res.clone().json()
      store.set(key, {
        data,
        expires: Date.now() + options.ttl,
      })
    }
  }
}
```

## Testing Middleware

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { timing } from './middleware'

describe('timing middleware', () => {
  it('adds response time header', async () => {
    const app = new Hono()
    app.use('*', timing())
    app.get('/', (c) => c.text('ok'))

    const res = await app.request('/')

    expect(res.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
  })
})
```

### Integration Testing

```typescript
describe('auth middleware', () => {
  it('blocks unauthenticated requests', async () => {
    const app = new Hono()
    app.use('/api/*', requireAuth())
    app.get('/api/data', (c) => c.json({ data: 'secret' }))

    const res = await app.request('/api/data')
    expect(res.status).toBe(401)
  })

  it('allows authenticated requests', async () => {
    const app = new Hono()
    app.use('/api/*', requireAuth())
    app.get('/api/data', (c) => c.json({ data: 'secret' }))

    const token = generateTestToken()
    const res = await app.request('/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
  })
})
```

## Best Practices

1. **Keep middleware focused**: Each middleware should do one thing well
2. **Use factory functions**: Make middleware configurable
3. **Type everything**: Leverage TypeScript for type safety
4. **Handle errors**: Always handle errors gracefully
5. **Order matters**: Apply middleware in the correct order
6. **Test thoroughly**: Write tests for all middleware
7. **Document behavior**: Comment complex middleware logic
8. **Avoid side effects**: Keep middleware pure when possible
9. **Use built-in middleware**: Don't reinvent the wheel
10. **Performance**: Be mindful of middleware overhead
