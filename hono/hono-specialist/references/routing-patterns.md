# Hono Routing Patterns

Comprehensive guide for routing in Hono applications.

## Basic Routing

### HTTP Methods

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/users', (c) => c.json({ method: 'GET' }))
app.post('/users', (c) => c.json({ method: 'POST' }))
app.put('/users/:id', (c) => c.json({ method: 'PUT' }))
app.patch('/users/:id', (c) => c.json({ method: 'PATCH' }))
app.delete('/users/:id', (c) => c.json({ method: 'DELETE' }))
app.options('/users', (c) => c.json({ method: 'OPTIONS' }))
```

### All Methods

Handle all HTTP methods for a route:

```typescript
app.all('/webhook', (c) => {
  return c.json({ method: c.req.method })
})
```

### HTTP Method Chaining

```typescript
app
  .get('/users', listUsers)
  .post('/users', createUser)
  .put('/users/:id', updateUser)
  .delete('/users/:id', deleteUser)
```

## Path Parameters

### Basic Parameters

```typescript
app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ userId: id })
})

// Multiple parameters
app.get('/users/:userId/posts/:postId', (c) => {
  const userId = c.req.param('userId')
  const postId = c.req.param('postId')
  return c.json({ userId, postId })
})
```

### Optional Parameters

```typescript
app.get('/users/:id?', (c) => {
  const id = c.req.param('id')
  if (!id) {
    return c.json({ all: 'users' })
  }
  return c.json({ userId: id })
})
```

### Wildcard Parameters

```typescript
// Match anything after /files/
app.get('/files/*', (c) => {
  const path = c.req.param('*')
  return c.json({ filePath: path })
})

// Example: /files/documents/report.pdf
// path = 'documents/report.pdf'
```

### Named Wildcards

```typescript
app.get('/files/:path{.+}', (c) => {
  const path = c.req.param('path')
  return c.json({ filePath: path })
})
```

## Query Parameters

### Reading Query Strings

```typescript
app.get('/search', (c) => {
  const query = c.req.query('q')
  const page = c.req.query('page')
  const limit = c.req.query('limit')

  return c.json({ query, page, limit })
})

// GET /search?q=typescript&page=1&limit=10
```

### Multiple Query Values

```typescript
app.get('/filter', (c) => {
  const tags = c.req.queries('tag') // Returns array
  return c.json({ tags })
})

// GET /filter?tag=javascript&tag=typescript&tag=react
// tags = ['javascript', 'typescript', 'react']
```

### All Query Parameters

```typescript
app.get('/search', (c) => {
  const queries = c.req.query()
  return c.json(queries)
})
```

### Query Validation with Zod

```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const querySchema = z.object({
  q: z.string().min(1),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  sort: z.enum(['asc', 'desc']).default('asc'),
})

app.get('/search', zValidator('query', querySchema), (c) => {
  const { q, page, limit, sort } = c.req.valid('query')
  // Fully typed and validated!
  return c.json({ q, page, limit, sort })
})
```

## Route Grouping

### Using Hono Instances

```typescript
import { Hono } from 'hono'

// Users router
const users = new Hono()
users.get('/', (c) => c.json({ users: [] }))
users.post('/', (c) => c.json({ created: true }))
users.get('/:id', (c) => c.json({ userId: c.req.param('id') }))
users.put('/:id', (c) => c.json({ updated: true }))
users.delete('/:id', (c) => c.json({ deleted: true }))

// Posts router
const posts = new Hono()
posts.get('/', (c) => c.json({ posts: [] }))
posts.post('/', (c) => c.json({ created: true }))

// Main app
const app = new Hono()
app.route('/api/users', users)
app.route('/api/posts', posts)

// Routes:
// GET  /api/users
// POST /api/users
// GET  /api/users/:id
// PUT  /api/users/:id
// DELETE /api/users/:id
// GET  /api/posts
// POST /api/posts
```

### Nested Routes

```typescript
const api = new Hono()

// User routes
const users = new Hono()
users.get('/', listUsers)
users.post('/', createUser)
users.get('/:id', getUser)

// User posts (nested)
const userPosts = new Hono()
userPosts.get('/', getUserPosts)
userPosts.post('/', createUserPost)

users.route('/:userId/posts', userPosts)

api.route('/users', users)

const app = new Hono()
app.route('/api', api)

// Routes:
// GET  /api/users
// POST /api/users
// GET  /api/users/:id
// GET  /api/users/:userId/posts
// POST /api/users/:userId/posts
```

### Base Path

```typescript
const api = new Hono().basePath('/api/v1')

api.get('/users', (c) => c.json({ users: [] }))
api.get('/posts', (c) => c.json({ posts: [] }))

// Routes:
// GET /api/v1/users
// GET /api/v1/posts
```

## RESTful API Patterns

### Resource-Based Routes

```typescript
const app = new Hono()

// List all resources
app.get('/api/users', async (c) => {
  const users = await db.users.findMany()
  return c.json(users)
})

// Create a resource
app.post('/api/users', async (c) => {
  const data = await c.req.json()
  const user = await db.users.create(data)
  return c.json(user, 201)
})

// Get a specific resource
app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.users.findUnique({ where: { id } })
  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }
  return c.json(user)
})

// Update a resource (full replacement)
app.put('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const user = await db.users.update({ where: { id }, data })
  return c.json(user)
})

// Partial update
app.patch('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  const data = await c.req.json()
  const user = await db.users.update({ where: { id }, data })
  return c.json(user)
})

// Delete a resource
app.delete('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  await db.users.delete({ where: { id } })
  return c.body(null, 204)
})
```

### Nested Resources

```typescript
// User's posts
app.get('/api/users/:userId/posts', async (c) => {
  const userId = c.req.param('userId')
  const posts = await db.posts.findMany({ where: { userId } })
  return c.json(posts)
})

app.post('/api/users/:userId/posts', async (c) => {
  const userId = c.req.param('userId')
  const data = await c.req.json()
  const post = await db.posts.create({ ...data, userId })
  return c.json(post, 201)
})

// Specific post of a user
app.get('/api/users/:userId/posts/:postId', async (c) => {
  const { userId, postId } = c.req.param()
  const post = await db.posts.findFirst({
    where: { id: postId, userId },
  })
  if (!post) {
    return c.json({ error: 'Post not found' }, 404)
  }
  return c.json(post)
})
```

### Collection Actions

```typescript
// Bulk operations
app.post('/api/users/bulk', async (c) => {
  const users = await c.req.json()
  const created = await db.users.createMany(users)
  return c.json(created, 201)
})

// Custom actions
app.post('/api/users/:id/activate', async (c) => {
  const id = c.req.param('id')
  await db.users.update({ where: { id }, data: { active: true } })
  return c.json({ message: 'User activated' })
})

app.post('/api/users/:id/deactivate', async (c) => {
  const id = c.req.param('id')
  await db.users.update({ where: { id }, data: { active: false } })
  return c.json({ message: 'User deactivated' })
})
```

## Advanced Routing Patterns

### Versioned APIs

```typescript
// v1
const v1 = new Hono().basePath('/api/v1')
v1.get('/users', (c) => c.json({ version: 'v1' }))

// v2
const v2 = new Hono().basePath('/api/v2')
v2.get('/users', (c) => c.json({ version: 'v2' }))

const app = new Hono()
app.route('/', v1)
app.route('/', v2)
```

### Content Negotiation

```typescript
app.get('/data', (c) => {
  const accept = c.req.header('Accept')

  if (accept?.includes('application/json')) {
    return c.json({ format: 'json' })
  }

  if (accept?.includes('text/html')) {
    return c.html('<h1>HTML Response</h1>')
  }

  if (accept?.includes('text/plain')) {
    return c.text('Plain text response')
  }

  return c.json({ error: 'Unsupported format' }, 406)
})
```

### Conditional Routes

```typescript
// Development-only routes
if (process.env.NODE_ENV === 'development') {
  app.get('/debug', (c) => {
    return c.json({ env: process.env })
  })
}

// Feature flags
if (process.env.ENABLE_BETA_FEATURES === 'true') {
  app.get('/api/beta/feature', (c) => {
    return c.json({ beta: true })
  })
}
```

### Route Prefixes by Environment

```typescript
const getPrefix = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      return '/api'
    case 'staging':
      return '/api-staging'
    default:
      return '/api-dev'
  }
}

const api = new Hono().basePath(getPrefix())
api.get('/users', getUsers)
```

## Middleware on Routes

### Route-Specific Middleware

```typescript
import { jwt } from 'hono/jwt'

const requireAuth = jwt({ secret: 'secret' })

// Public route
app.get('/public', (c) => c.json({ public: true }))

// Protected route
app.get('/protected', requireAuth, (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ protected: true, user: payload })
})
```

### Group Middleware

```typescript
const admin = new Hono()

// All routes in this group require admin auth
admin.use('*', requireAdminAuth())

admin.get('/users', listAllUsers)
admin.delete('/users/:id', deleteUser)
admin.post('/settings', updateSettings)

app.route('/admin', admin)
```

### Multiple Middleware

```typescript
app.get(
  '/api/users',
  requireAuth(),
  validateApiKey(),
  rateLimiter(),
  getUsers
)
```

## Routing with TypeScript

### Typed Parameters

```typescript
import { Hono } from 'hono'

type Env = {
  Bindings: {
    DB: D1Database
  }
}

const app = new Hono<Env>()

app.get('/users/:id', (c) => {
  const id = c.req.param('id') // string
  const db = c.env.DB // D1Database
  return c.json({ id })
})
```

### Typed Variables

```typescript
type Variables = {
  user: {
    id: string
    name: string
  }
}

const app = new Hono<{ Variables: Variables }>()

app.use('*', async (c, next) => {
  c.set('user', { id: '123', name: 'John' })
  await next()
})

app.get('/profile', (c) => {
  const user = c.get('user') // Fully typed!
  return c.json(user)
})
```

## Error Handling in Routes

### Try-Catch Pattern

```typescript
app.get('/users/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const user = await db.users.findUnique({ where: { id } })

    if (!user) {
      return c.json({ error: 'User not found' }, 404)
    }

    return c.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
```

### Using HTTP Exception

```typescript
import { HTTPException } from 'hono/http-exception'

app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.users.findUnique({ where: { id } })

  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return c.json(user)
})

// Global error handler
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  return c.json({ error: 'Internal server error' }, 500)
})
```

## Route Organization

### File Structure (Recommended)

```
src/
├── index.ts          # Entry point
├── app.ts            # App initialization
├── routes/
│   ├── index.ts      # Route aggregation
│   ├── users.ts      # User routes
│   ├── posts.ts      # Post routes
│   └── auth.ts       # Auth routes
├── middleware/
│   ├── auth.ts
│   ├── logger.ts
│   └── validation.ts
└── lib/
    ├── db.ts
    └── utils.ts
```

### routes/users.ts

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { userSchema } from '../schemas'

const users = new Hono()

users.get('/', async (c) => {
  const users = await db.users.findMany()
  return c.json(users)
})

users.post('/', zValidator('json', userSchema), async (c) => {
  const data = c.req.valid('json')
  const user = await db.users.create(data)
  return c.json(user, 201)
})

users.get('/:id', async (c) => {
  const id = c.req.param('id')
  const user = await db.users.findUnique({ where: { id } })
  if (!user) {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json(user)
})

export default users
```

### routes/index.ts

```typescript
import { Hono } from 'hono'
import users from './users'
import posts from './posts'
import auth from './auth'

const routes = new Hono()

routes.route('/users', users)
routes.route('/posts', posts)
routes.route('/auth', auth)

export default routes
```

### app.ts

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import routes from './routes'

const app = new Hono()

// Global middleware
app.use('*', logger())
app.use('*', cors())

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }))

// API routes
app.route('/api', routes)

export default app
```

## Testing Routes

### Basic Route Test

```typescript
import { describe, it, expect } from 'vitest'
import app from './app'

describe('GET /api/users', () => {
  it('returns users list', async () => {
    const res = await app.request('/api/users')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})
```

### Testing with Parameters

```typescript
describe('GET /api/users/:id', () => {
  it('returns user by id', async () => {
    const res = await app.request('/api/users/123')
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data).toHaveProperty('id', '123')
  })

  it('returns 404 for non-existent user', async () => {
    const res = await app.request('/api/users/999')
    expect(res.status).toBe(404)
  })
})
```

### Testing POST Requests

```typescript
describe('POST /api/users', () => {
  it('creates a new user', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
    }

    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })

    expect(res.status).toBe(201)

    const data = await res.json()
    expect(data).toMatchObject(userData)
  })

  it('validates required fields', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(400)
  })
})
```
