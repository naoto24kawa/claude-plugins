/**
 * Deno Deploy Entry Point for Hono
 *
 * Demonstrates how to:
 * - Deploy Hono to Deno Deploy
 * - Use Deno KV
 * - Access environment variables
 * - Use Deno-specific APIs
 */

import { Hono } from 'hono'

const app = new Hono()

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'deno',
    version: Deno.version.deno,
    timestamp: new Date().toISOString(),
  })
})

/**
 * Environment variables
 */
app.get('/api/config', (c) => {
  return c.json({
    environment: Deno.env.get('ENVIRONMENT') || 'production',
    version: Deno.env.get('API_VERSION') || 'v1',
  })
})

/**
 * Deno KV example
 */
const kv = await Deno.openKv()

app.get('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  const result = await kv.get([key])

  if (!result.value) {
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
    data: { key, value: result.value },
  })
})

app.post('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json()

  await kv.set([key], value)

  return c.json({
    success: true,
    message: 'Value stored successfully',
  })
})

app.delete('/api/kv/:key', async (c) => {
  const key = c.req.param('key')
  await kv.delete([key])

  return c.json({
    success: true,
    message: 'Value deleted successfully',
  })
})

/**
 * File system access (read-only in Deno Deploy)
 */
app.get('/api/files/:path', async (c) => {
  const path = c.req.param('path')

  try {
    const content = await Deno.readTextFile(`./public/${path}`)
    return c.text(content)
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'File not found',
      },
      404
    )
  }
})

/**
 * Start server
 */
Deno.serve({ port: 8000 }, app.fetch)

/**
 * Deploy commands:
 *
 * # Install Deno Deploy CLI
 * deno install --allow-all --no-check -r -f https://deno.land/x/deploy/deployctl.ts
 *
 * # Deploy
 * deployctl deploy --project=my-project src/main.ts
 *
 * # Or connect to GitHub for automatic deployments
 * # https://dash.deno.com/projects
 */
