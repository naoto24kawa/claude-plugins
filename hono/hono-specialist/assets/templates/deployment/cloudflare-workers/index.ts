/**
 * Cloudflare Workers Entry Point for Hono
 *
 * Demonstrates how to:
 * - Define Cloudflare bindings types
 * - Access D1, KV, R2
 * - Use environment variables
 * - Deploy to Cloudflare Workers
 */

import { Hono } from 'hono'

/**
 * Cloudflare Workers bindings
 */
type Bindings = {
  // D1 Database
  DB: D1Database

  // KV Namespace
  CACHE: KVNamespace

  // R2 Bucket
  STORAGE: R2Bucket

  // Environment variables
  ENVIRONMENT: string
  API_VERSION: string
  JWT_SECRET: string
}

/**
 * Context variables
 */
type Variables = {
  user?: {
    id: string
    email: string
  }
}

/**
 * Create app with bindings
 */
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    version: c.env.API_VERSION,
    timestamp: new Date().toISOString(),
  })
})

/**
 * D1 Database example
 */
app.get('/api/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT id, name, email FROM users LIMIT 10'
    ).all()

    return c.json({
      success: true,
      data: results,
    })
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Database error',
      },
      500
    )
  }
})

/**
 * KV Namespace example
 */
app.get('/api/cache/:key', async (c) => {
  const key = c.req.param('key')
  const value = await c.env.CACHE.get(key)

  if (!value) {
    return c.json(
      {
        success: false,
        error: 'Key not found',
      },
      404
    )
  }

  return c.json({
    success: true,
    data: { key, value },
  })
})

app.post('/api/cache/:key', async (c) => {
  const key = c.req.param('key')
  const { value, ttl } = await c.req.json()

  await c.env.CACHE.put(key, value, {
    expirationTtl: ttl || 3600, // Default 1 hour
  })

  return c.json({
    success: true,
    message: 'Cached successfully',
  })
})

/**
 * R2 Storage example
 */
app.get('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.STORAGE.get(key)

  if (!object) {
    return c.json(
      {
        success: false,
        error: 'File not found',
      },
      404
    )
  }

  return c.body(await object.arrayBuffer(), {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': object.size.toString(),
    },
  })
})

app.put('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  const body = await c.req.arrayBuffer()

  await c.env.STORAGE.put(key, body, {
    httpMetadata: {
      contentType: c.req.header('content-type') || 'application/octet-stream',
    },
  })

  return c.json({
    success: true,
    message: 'File uploaded successfully',
  })
})

/**
 * Scheduled handler (cron jobs)
 */
export default {
  fetch: app.fetch,

  // Cron trigger
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log('Cron job triggered:', event.cron)

    // Example: Clean up old cache entries
    // await cleanupCache(env.CACHE)

    ctx.waitUntil(Promise.resolve())
  },
}

/**
 * Deploy commands:
 *
 * # Development
 * npx wrangler dev
 *
 * # Deploy to production
 * npx wrangler deploy
 *
 * # Deploy to staging
 * npx wrangler deploy --env staging
 *
 * # View logs
 * npx wrangler tail
 *
 * # Set secrets
 * npx wrangler secret put JWT_SECRET
 */
