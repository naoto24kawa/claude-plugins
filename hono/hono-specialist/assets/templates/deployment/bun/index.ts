/**
 * Bun Entry Point for Hono
 *
 * Demonstrates how to:
 * - Run Hono on Bun
 * - Use Bun-specific APIs
 * - Access file system
 * - Use SQLite with Bun
 */

import { Hono } from 'hono'
import { Database } from 'bun:sqlite'

const app = new Hono()

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    runtime: 'bun',
    version: Bun.version,
    timestamp: new Date().toISOString(),
  })
})

/**
 * Environment variables
 */
app.get('/api/config', (c) => {
  return c.json({
    environment: process.env.NODE_ENV || 'production',
    port: process.env.PORT || 3000,
  })
})

/**
 * File operations with Bun
 */
app.get('/api/files/:name', async (c) => {
  const name = c.req.param('name')
  const file = Bun.file(`./uploads/${name}`)

  if (!(await file.exists())) {
    return c.json(
      {
        success: false,
        error: 'File not found',
      },
      404
    )
  }

  return c.body(await file.arrayBuffer(), {
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size.toString(),
    },
  })
})

app.post('/api/files/:name', async (c) => {
  const name = c.req.param('name')
  const body = await c.req.arrayBuffer()

  await Bun.write(`./uploads/${name}`, body)

  return c.json({
    success: true,
    message: 'File uploaded successfully',
  })
})

/**
 * SQLite with Bun
 */
const db = new Database('app.sqlite', { create: true })

// Initialize database
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

app.get('/api/users', (c) => {
  const users = db.query('SELECT * FROM users').all()

  return c.json({
    success: true,
    data: users,
  })
})

app.post('/api/users', async (c) => {
  const { name, email } = await c.req.json()

  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)')
  const result = stmt.run(name, email)

  return c.json(
    {
      success: true,
      data: { id: result.lastInsertRowid },
    },
    201
  )
})

/**
 * Export for Bun
 */
export default {
  port: parseInt(process.env.PORT || '3000'),
  fetch: app.fetch,
}

/**
 * Run commands:
 *
 * # Development
 * bun run dev
 *
 * # Production build
 * bun run build
 * bun run start
 *
 * # Test
 * bun test
 */
