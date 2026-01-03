/**
 * Complete CRUD API Template for Hono
 *
 * Production-ready CRUD operations with:
 * - Full CRUD operations (Create, Read, Update, Delete)
 * - Search and filtering
 * - Sorting and pagination
 * - Validation and error handling
 * - Authentication and authorization
 * - Soft delete support
 */

import { Hono } from 'hono'
import { z } from 'zod'
import {
  validateBody,
  validateQuery,
  validateParam,
} from '../middleware/validation-zod'
import { authMiddleware, requireRole } from '../middleware/auth-jwt'
import { success, paginated, noContent } from '../utilities/response-helpers'
import { NotFoundError, ForbiddenError } from '../utilities/error-types'

/**
 * Resource type definition
 */
export interface Post {
  id: string
  title: string
  content: string
  authorId: string
  published: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * Validation schemas
 */
const postCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  published: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
})

const postUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  published: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

const postIdSchema = z.object({
  id: z.string().uuid('Invalid post ID'),
})

const postListQuerySchema = z.object({
  // Pagination
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),

  // Filtering
  published: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  authorId: z.string().uuid().optional(),
  tags: z.string().optional(), // Comma-separated tags

  // Searching
  search: z.string().optional(), // Search in title and content

  // Sorting
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),

  // Soft delete
  includeDeleted: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
})

/**
 * Posts CRUD API
 */
const posts = new Hono()

/**
 * GET /posts
 * List posts with filtering, searching, sorting, and pagination
 */
posts.get('/', validateQuery(postListQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const user = c.get('user')

  // Build database query
  // const where = {
  //   ...(query.published !== undefined && { published: query.published }),
  //   ...(query.authorId && { authorId: query.authorId }),
  //   ...(query.tags && { tags: { hasSome: query.tags.split(',') } }),
  //   ...(query.search && {
  //     OR: [
  //       { title: { contains: query.search } },
  //       { content: { contains: query.search } },
  //     ],
  //   }),
  //   ...(query.includeDeleted ? {} : { deletedAt: null }),
  // }

  // const posts = await db.posts.findMany({
  //   where,
  //   skip: (query.page - 1) * query.limit,
  //   take: query.limit,
  //   orderBy: { [query.sortBy]: query.order },
  // })

  // const total = await db.posts.count({ where })

  // Mock data
  const mockPosts: Post[] = [
    {
      id: '1',
      title: 'Sample Post',
      content: 'This is a sample post content',
      authorId: user?.id || '1',
      published: true,
      tags: ['hono', 'typescript'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
  ]

  return paginated(c, mockPosts, {
    page: query.page,
    limit: query.limit,
    total: 100,
  })
})

/**
 * GET /posts/:id
 * Get a single post by ID
 */
posts.get('/:id', validateParam(postIdSchema), async (c) => {
  const { id } = c.req.valid('param')

  // const post = await db.posts.findUnique({
  //   where: { id, deletedAt: null },
  // })

  // Mock data
  const post: Post | null = {
    id,
    title: 'Sample Post',
    content: 'This is a sample post content',
    authorId: '1',
    published: true,
    tags: ['hono', 'typescript'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  }

  if (!post) {
    throw new NotFoundError('Post not found')
  }

  return success(c, post)
})

/**
 * POST /posts
 * Create a new post (requires authentication)
 */
posts.post(
  '/',
  authMiddleware(),
  validateBody(postCreateSchema),
  async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')

    // const post = await db.posts.create({
    //   data: {
    //     ...data,
    //     authorId: user.id,
    //   },
    // })

    // Mock data
    const post: Post = {
      id: crypto.randomUUID(),
      ...data,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    }

    return success(c, post, 'Post created successfully', 201)
  }
)

/**
 * PUT /posts/:id
 * Update a post (requires authentication and ownership)
 */
posts.put(
  '/:id',
  authMiddleware(),
  validateParam(postIdSchema),
  validateBody(postUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const data = c.req.valid('json')
    const user = c.get('user')

    // const existingPost = await db.posts.findUnique({
    //   where: { id, deletedAt: null },
    // })

    // Mock existing post
    const existingPost: Post | null = {
      id,
      title: 'Original Title',
      content: 'Original content',
      authorId: user.id,
      published: false,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    }

    if (!existingPost) {
      throw new NotFoundError('Post not found')
    }

    // Check ownership (unless admin)
    if (existingPost.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('You can only edit your own posts')
    }

    // const post = await db.posts.update({
    //   where: { id },
    //   data,
    // })

    // Mock updated post
    const post: Post = {
      ...existingPost,
      ...data,
      updatedAt: new Date().toISOString(),
    }

    return success(c, post, 'Post updated successfully')
  }
)

/**
 * PATCH /posts/:id/publish
 * Publish/unpublish a post
 */
posts.patch(
  '/:id/publish',
  authMiddleware(),
  validateParam(postIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const { published } = await c.req.json()

    // const post = await db.posts.update({
    //   where: { id },
    //   data: { published },
    // })

    return success(c, null, `Post ${published ? 'published' : 'unpublished'}`)
  }
)

/**
 * DELETE /posts/:id
 * Soft delete a post (requires authentication and ownership)
 */
posts.delete(
  '/:id',
  authMiddleware(),
  validateParam(postIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const user = c.get('user')

    // const existingPost = await db.posts.findUnique({
    //   where: { id, deletedAt: null },
    // })

    if (!existingPost) {
      throw new NotFoundError('Post not found')
    }

    // Check ownership (unless admin)
    if (existingPost.authorId !== user.id && user.role !== 'admin') {
      throw new ForbiddenError('You can only delete your own posts')
    }

    // Soft delete
    // await db.posts.update({
    //   where: { id },
    //   data: { deletedAt: new Date().toISOString() },
    // })

    return noContent(c)
  }
)

/**
 * DELETE /posts/:id/permanent
 * Permanently delete a post (admin only)
 */
posts.delete(
  '/:id/permanent',
  authMiddleware(),
  requireRole(['admin']),
  validateParam(postIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')

    // await db.posts.delete({ where: { id } })

    return noContent(c)
  }
)

/**
 * POST /posts/:id/restore
 * Restore a soft-deleted post
 */
posts.post(
  '/:id/restore',
  authMiddleware(),
  validateParam(postIdSchema),
  async (c) => {
    const { id } = c.req.valid('param')

    // await db.posts.update({
    //   where: { id },
    //   data: { deletedAt: null },
    // })

    return success(c, null, 'Post restored successfully')
  }
)

/**
 * Export routes
 */
export { posts }

/**
 * Usage example:
 *
 * import { Hono } from 'hono'
 * import { posts } from './templates/api/crud-api'
 * import { loggingMiddleware } from './templates/middleware/logging'
 * import { errorHandler } from './templates/middleware/error-handling'
 *
 * const app = new Hono()
 *
 * app.use('*', loggingMiddleware())
 * app.route('/api/posts', posts)
 * app.onError(errorHandler)
 *
 * export default app
 */
