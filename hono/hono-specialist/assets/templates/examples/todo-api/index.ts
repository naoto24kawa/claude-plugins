/**
 * Complete Todo API Example with Hono
 *
 * Features:
 * - Full CRUD operations
 * - Authentication (JWT)
 * - Validation (Zod)
 * - Error handling
 * - Logging
 * - TypeScript types
 * - In-memory database (easily replaceable)
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { validateBody, validateQuery, validateParam } from '../../middleware/validation-zod'
import { authMiddleware, jwtAuth } from '../../middleware/auth-jwt'
import { loggingMiddleware } from '../../middleware/logging'
import { errorHandler, notFoundHandler } from '../../middleware/error-handling'
import { success, paginated, notFound } from '../../utilities/response-helpers'
import { NotFoundError } from '../../utilities/error-types'

/**
 * Types
 */
interface Todo {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

/**
 * In-memory database
 */
const todos: Map<string, Todo> = new Map()

/**
 * Validation schemas
 */
const todoCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().datetime().nullable().optional().default(null),
})

const todoUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  completed: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
})

const todoIdSchema = z.object({
  id: z.string().uuid(),
})

const todoListQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  completed: z.string().optional().transform((val) => val === 'true'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  search: z.string().optional(),
})

/**
 * Todo routes
 */
const todoRoutes = new Hono()

// Require authentication for all todo routes
todoRoutes.use('*', jwtAuth())
todoRoutes.use('*', authMiddleware())

/**
 * GET /todos
 * List todos with filtering and pagination
 */
todoRoutes.get('/', validateQuery(todoListQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const user = c.get('user')

  // Filter todos
  let filteredTodos = Array.from(todos.values()).filter(
    (todo) => todo.userId === user.id
  )

  // Apply filters
  if (query.completed !== undefined) {
    filteredTodos = filteredTodos.filter(
      (todo) => todo.completed === query.completed
    )
  }

  if (query.priority) {
    filteredTodos = filteredTodos.filter(
      (todo) => todo.priority === query.priority
    )
  }

  if (query.search) {
    const searchLower = query.search.toLowerCase()
    filteredTodos = filteredTodos.filter(
      (todo) =>
        todo.title.toLowerCase().includes(searchLower) ||
        todo.description.toLowerCase().includes(searchLower)
    )
  }

  // Sort by creation date (newest first)
  filteredTodos.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  // Pagination
  const total = filteredTodos.length
  const start = (query.page - 1) * query.limit
  const paginatedTodos = filteredTodos.slice(start, start + query.limit)

  return paginated(c, paginatedTodos, {
    page: query.page,
    limit: query.limit,
    total,
  })
})

/**
 * GET /todos/:id
 * Get a single todo
 */
todoRoutes.get('/:id', validateParam(todoIdSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  const todo = todos.get(id)

  if (!todo || todo.userId !== user.id) {
    throw new NotFoundError('Todo not found')
  }

  return success(c, todo)
})

/**
 * POST /todos
 * Create a new todo
 */
todoRoutes.post('/', validateBody(todoCreateSchema), async (c) => {
  const data = c.req.valid('json')
  const user = c.get('user')

  const todo: Todo = {
    id: crypto.randomUUID(),
    ...data,
    completed: false,
    userId: user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  todos.set(todo.id, todo)

  return success(c, todo, 'Todo created successfully', 201)
})

/**
 * PUT /todos/:id
 * Update a todo
 */
todoRoutes.put(
  '/:id',
  validateParam(todoIdSchema),
  validateBody(todoUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const user = c.get('user')

    const todo = todos.get(id)

    if (!todo || todo.userId !== user.id) {
      throw new NotFoundError('Todo not found')
    }

    const updatedTodo: Todo = {
      ...todo,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    todos.set(id, updatedTodo)

    return success(c, updatedTodo, 'Todo updated successfully')
  }
)

/**
 * PATCH /todos/:id/toggle
 * Toggle todo completion status
 */
todoRoutes.patch('/:id/toggle', validateParam(todoIdSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  const todo = todos.get(id)

  if (!todo || todo.userId !== user.id) {
    throw new NotFoundError('Todo not found')
  }

  const updatedTodo: Todo = {
    ...todo,
    completed: !todo.completed,
    updatedAt: new Date().toISOString(),
  }

  todos.set(id, updatedTodo)

  return success(c, updatedTodo, 'Todo status updated')
})

/**
 * DELETE /todos/:id
 * Delete a todo
 */
todoRoutes.delete('/:id', validateParam(todoIdSchema), async (c) => {
  const { id } = c.req.valid('param')
  const user = c.get('user')

  const todo = todos.get(id)

  if (!todo || todo.userId !== user.id) {
    throw new NotFoundError('Todo not found')
  }

  todos.delete(id)

  return success(c, null, 'Todo deleted successfully')
})

/**
 * GET /todos/stats
 * Get todo statistics
 */
todoRoutes.get('/stats', async (c) => {
  const user = c.get('user')

  const userTodos = Array.from(todos.values()).filter(
    (todo) => todo.userId === user.id
  )

  const stats = {
    total: userTodos.length,
    completed: userTodos.filter((t) => t.completed).length,
    pending: userTodos.filter((t) => !t.completed).length,
    byPriority: {
      low: userTodos.filter((t) => t.priority === 'low').length,
      medium: userTodos.filter((t) => t.priority === 'medium').length,
      high: userTodos.filter((t) => t.priority === 'high').length,
    },
  }

  return success(c, stats)
})

/**
 * Main app
 */
const app = new Hono()

// Global middleware
app.use('*', cors())
app.use('*', loggingMiddleware())

// Health check
app.get('/health', (c) => {
  return success(c, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// Mount routes
app.route('/api/todos', todoRoutes)

// Error handlers
app.onError(errorHandler)
app.notFound(notFoundHandler)

export default app

/**
 * For Cloudflare Workers:
 * export default app
 *
 * For Node.js:
 * import { serve } from '@hono/node-server'
 * serve({ fetch: app.fetch, port: 3000 })
 *
 * For Deno:
 * Deno.serve(app.fetch)
 */
