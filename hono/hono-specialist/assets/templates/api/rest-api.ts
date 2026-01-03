/**
 * REST API Template for Hono
 *
 * Complete REST API structure with best practices:
 * - Route grouping
 * - Middleware integration
 * - Validation
 * - Error handling
 * - TypeScript types
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { validateBody, validateQuery, validateParam } from '../middleware/validation-zod'
import { success, error, paginated } from '../utilities/response-helpers'
import { NotFoundError } from '../utilities/error-types'

/**
 * Example: User resource types
 */
export interface User {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

/**
 * Validation schemas
 */
const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
})

const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

const userIdSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
})

const paginationSchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
})

/**
 * User API routes
 */
const users = new Hono()

/**
 * GET /users
 * List all users with pagination
 */
users.get('/', validateQuery(paginationSchema), async (c) => {
  const { page, limit } = c.req.valid('query')

  // Fetch users from database
  // const users = await db.users.findMany({ skip: (page - 1) * limit, take: limit })
  // const total = await db.users.count()

  // Mock data for example
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  return paginated(c, mockUsers, { page, limit, total: 100 })
})

/**
 * GET /users/:id
 * Get a single user by ID
 */
users.get('/:id', validateParam(userIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  // Fetch user from database
  // const user = await db.users.findUnique({ where: { id } })

  // Mock data for example
  const user: User | null = {
    id,
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (!user) {
    throw new NotFoundError('User not found')
  }

  return success(c, user)
})

/**
 * POST /users
 * Create a new user
 */
users.post('/', validateBody(userCreateSchema), async (c) => {
  const data = c.req.valid('json')

  // Create user in database
  // const user = await db.users.create({ data })

  // Mock data for example
  const user: User = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return success(c, user, 'User created successfully', 201)
})

/**
 * PUT /users/:id
 * Update a user
 */
users.put(
  '/:id',
  validateParam(userIdSchema),
  validateBody(userUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')

    // Update user in database
    // const user = await db.users.update({ where: { id }, data })

    // Mock data for example
    const user: User = {
      id,
      name: data.name || 'John Doe',
      email: data.email || 'john@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return success(c, user, 'User updated successfully')
  }
)

/**
 * DELETE /users/:id
 * Delete a user
 */
users.delete('/:id', validateParam(userIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  // Delete user from database
  // await db.users.delete({ where: { id } })

  return success(c, null, 'User deleted successfully')
})

/**
 * Mount users routes
 *
 * @example
 * const app = new Hono()
 * app.route('/api/users', users)
 */
export { users }

/**
 * Complete API setup example
 */
export function createAPI() {
  const app = new Hono()

  // Mount resource routes
  app.route('/users', users)

  // Health check
  app.get('/health', (c) => {
    return success(c, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  })

  return app
}

/**
 * Usage example:
 *
 * import { createAPI } from './templates/api/rest-api'
 * import { loggingMiddleware } from './templates/middleware/logging'
 * import { errorHandler, notFoundHandler } from './templates/middleware/error-handling'
 *
 * const app = new Hono()
 *
 * // Global middleware
 * app.use('*', loggingMiddleware())
 *
 * // Mount API
 * app.route('/api', createAPI())
 *
 * // Error handlers
 * app.onError(errorHandler)
 * app.notFound(notFoundHandler)
 *
 * export default app
 */
