# Hono Deployment Guide

Complete guide for deploying Hono applications to various platforms.

## Cloudflare Workers

### Setup

```bash
npm create hono@latest my-app
cd my-app
npm install
```

### wrangler.toml

```toml
name = "my-hono-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "xxx"

# KV Namespace
[[kv_namespaces]]
binding = "KV"
id = "xxx"

# R2 Bucket
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-bucket"

# Environment variables
[vars]
ENVIRONMENT = "production"

# Secrets (set with: wrangler secret put SECRET_NAME)
# SECRET_KEY = "xxx"
```

### Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  BUCKET: R2Bucket
  SECRET_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello from Cloudflare Workers!')
})

app.get('/db', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM users').all()
  return c.json(result)
})

export default app
```

### Deploy

```bash
# Development
npm run dev

# Deploy
npx wrangler deploy

# View logs
npx wrangler tail
```

### Custom Domains

```toml
# wrangler.toml
routes = [
  { pattern = "api.example.com", custom_domain = true }
]
```

### Workers KV

```typescript
app.get('/cache/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.KV.get(key)

  if (!value) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ key, value })
})

app.post('/cache/:key', async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json()

  await c.env.KV.put(key, value, {
    expirationTtl: 3600, // 1 hour
  })

  return c.json({ success: true })
})
```

### D1 Database

```typescript
app.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM users'
  ).all()

  return c.json(results)
})

app.post('/users', async (c) => {
  const { name, email } = await c.req.json()

  await c.env.DB.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).bind(name, email).run()

  return c.json({ success: true }, 201)
})
```

### R2 Storage

```typescript
app.get('/files/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.BUCKET.get(key)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  return c.body(await object.arrayBuffer())
})

app.put('/files/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.arrayBuffer()

  await c.env.BUCKET.put(key, body)

  return c.json({ success: true })
})
```

## Deno Deploy

### Setup

```bash
# Initialize project
deno init my-app
cd my-app
```

### deno.json

```json
{
  "tasks": {
    "dev": "deno run --allow-net --allow-env --watch main.ts",
    "start": "deno run --allow-net --allow-env main.ts"
  },
  "imports": {
    "hono": "https://deno.land/x/hono/mod.ts",
    "hono/": "https://deno.land/x/hono/"
  }
}
```

### Entry Point

```typescript
// main.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from Deno Deploy!')
})

app.get('/env', (c) => {
  return c.json({
    runtime: 'deno',
    version: Deno.version.deno,
  })
})

Deno.serve(app.fetch)
```

### Deploy

```bash
# Install Deno Deploy CLI
deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts

# Deploy
deployctl deploy --project=my-project main.ts

# Or connect to GitHub for automatic deployments
```

### Environment Variables

```typescript
const app = new Hono()

app.get('/config', (c) => {
  return c.json({
    apiKey: Deno.env.get('API_KEY'),
    environment: Deno.env.get('ENVIRONMENT'),
  })
})
```

### Deno KV

```typescript
const kv = await Deno.openKv()

app.get('/cache/:key', async (c) => {
  const key = c.req.param('key')
  const result = await kv.get([key])

  if (!result.value) {
    return c.json({ error: 'Not found' }, 404)
  }

  return c.json({ key, value: result.value })
})

app.post('/cache/:key', async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json()

  await kv.set([key], value)

  return c.json({ success: true })
})
```

## Bun

### Setup

```bash
bun create hono my-app
cd my-app
bun install
```

### package.json

```json
{
  "name": "my-hono-app",
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist --target bun",
    "start": "bun run dist/index.js"
  },
  "dependencies": {
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

### Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from Bun!')
})

export default {
  port: 3000,
  fetch: app.fetch,
}
```

### Run

```bash
# Development
bun run dev

# Production
bun run build
bun run start
```

### Using Bun APIs

```typescript
// File operations
app.get('/file/:name', async (c) => {
  const name = c.req.param('name')
  const file = Bun.file(`./files/${name}`)

  if (!await file.exists()) {
    return c.json({ error: 'File not found' }, 404)
  }

  return c.body(await file.arrayBuffer())
})

// SQLite
import { Database } from 'bun:sqlite'

const db = new Database('mydb.sqlite')

app.get('/users', (c) => {
  const users = db.query('SELECT * FROM users').all()
  return c.json(users)
})
```

## Node.js

### Setup

```bash
npm create hono@latest my-app
cd my-app
npm install
npm install @hono/node-server
```

### package.json

```json
{
  "name": "my-hono-app",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@hono/node-server": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello from Node.js!')
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## Vercel

### Setup

```bash
npm install -g vercel
vercel login
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": null,
  "outputDirectory": "dist"
}
```

### Entry Point

```typescript
// api/index.ts
import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const app = new Hono().basePath('/api')

app.get('/hello', (c) => {
  return c.json({ message: 'Hello from Vercel!' })
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
```

### Deploy

```bash
vercel deploy --prod
```

## AWS Lambda

### Setup

```bash
npm install @hono/aws-lambda
```

### Entry Point

```typescript
// src/index.ts
import { Hono } from 'hono'
import { handle } from '@hono/aws-lambda'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Hello from AWS Lambda!' })
})

export const handler = handle(app)
```

### SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  HonoFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: dist/index.handler
      Runtime: nodejs20.x
      CodeUri: .
      MemorySize: 256
      Timeout: 30
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

### Deploy

```bash
sam build
sam deploy --guided
```

## Environment Variables

### Cloudflare Workers

```bash
# Set secret
wrangler secret put SECRET_KEY

# wrangler.toml
[vars]
PUBLIC_VAR = "value"
```

```typescript
app.get('/env', (c) => {
  return c.json({
    public: c.env.PUBLIC_VAR,
    secret: c.env.SECRET_KEY,
  })
})
```

### Deno

```bash
# .env file
API_KEY=xxx
```

```typescript
import { load } from "https://deno.land/std/dotenv/mod.ts"

const env = await load()

app.get('/config', (c) => {
  return c.json({
    apiKey: env.API_KEY,
  })
})
```

### Bun

```bash
# .env file
DATABASE_URL=postgres://...
```

```typescript
app.get('/config', (c) => {
  return c.json({
    dbUrl: process.env.DATABASE_URL,
  })
})
```

### Node.js

```bash
npm install dotenv
```

```typescript
import 'dotenv/config'

app.get('/config', (c) => {
  return c.json({
    env: process.env.NODE_ENV,
    dbUrl: process.env.DATABASE_URL,
  })
})
```

## HTTPS and SSL

### Cloudflare Workers

HTTPS is automatic with Cloudflare Workers.

### Custom SSL (Node.js)

```typescript
import { createServer } from 'https'
import { readFileSync } from 'fs'
import { serve } from '@hono/node-server'

const app = new Hono()

const server = createServer({
  key: readFileSync('./key.pem'),
  cert: readFileSync('./cert.pem'),
}, app.fetch)

server.listen(443)
```

## Monitoring and Logging

### Cloudflare Workers

```typescript
app.use('*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start

  // Log to Cloudflare Analytics
  c.executionCtx.waitUntil(
    fetch('https://analytics.example.com/log', {
      method: 'POST',
      body: JSON.stringify({
        path: c.req.path,
        method: c.req.method,
        status: c.res.status,
        duration,
      }),
    })
  )
})
```

### Structured Logging

```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...data }))
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error }))
  },
}

app.use('*', async (c, next) => {
  logger.info('Request received', {
    path: c.req.path,
    method: c.req.method,
  })

  try {
    await next()
  } catch (error) {
    logger.error('Request failed', error)
    throw error
  }
})
```

## Best Practices

1. **Use TypeScript**: Type safety prevents runtime errors
2. **Environment variables**: Never hardcode secrets
3. **Error handling**: Always handle errors gracefully
4. **Monitoring**: Set up logging and monitoring
5. **Health checks**: Implement health check endpoints
6. **Graceful shutdown**: Handle shutdown signals properly
7. **Rate limiting**: Protect your API from abuse
8. **CORS**: Configure CORS properly for security
9. **Compression**: Enable compression for better performance
10. **Caching**: Use caching where appropriate

## Performance Tips

1. **Connection pooling**: Reuse database connections
2. **Lazy loading**: Load resources only when needed
3. **Streaming**: Use streaming for large responses
4. **Caching**: Cache expensive operations
5. **CDN**: Use CDN for static assets
6. **Minification**: Minify your code for production
7. **Tree shaking**: Remove unused code
8. **Code splitting**: Split code into smaller chunks
9. **Worker threads**: Use worker threads for CPU-intensive tasks
10. **Profiling**: Profile your application regularly
