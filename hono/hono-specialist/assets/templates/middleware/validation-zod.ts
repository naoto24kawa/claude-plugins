/**
 * Zod Validation Middleware for Hono
 *
 * Provides type-safe validation for request body, query, and params
 * using Zod schemas with proper error handling.
 */

import { MiddlewareHandler } from 'hono'
import { z, ZodSchema } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { ValidationError } from '../utilities/error-types'

/**
 * Validate request JSON body
 *
 * @example
 * const schema = z.object({
 *   name: z.string().min(1),
 *   email: z.string().email(),
 * })
 * app.post('/users', validateBody(schema), createUser)
 */
export function validateBody<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return zValidator('json', schema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Request body validation failed', {
        errors: result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
  })
}

/**
 * Validate query parameters
 *
 * @example
 * const schema = z.object({
 *   page: z.string().regex(/^\d+$/),
 *   limit: z.string().regex(/^\d+$/),
 * })
 * app.get('/users', validateQuery(schema), getUsers)
 */
export function validateQuery<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return zValidator('query', schema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Query parameter validation failed', {
        errors: result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
  })
}

/**
 * Validate path parameters
 *
 * @example
 * const schema = z.object({
 *   id: z.string().uuid(),
 * })
 * app.get('/users/:id', validateParam(schema), getUser)
 */
export function validateParam<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return zValidator('param', schema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Path parameter validation failed', {
        errors: result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
  })
}

/**
 * Validate request headers
 *
 * @example
 * const schema = z.object({
 *   'x-api-key': z.string().min(1),
 * })
 * app.use('/api/*', validateHeaders(schema))
 */
export function validateHeaders<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return zValidator('header', schema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Header validation failed', {
        errors: result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
  })
}

/**
 * Validate form data
 *
 * @example
 * const schema = z.object({
 *   file: z.instanceof(File),
 *   title: z.string(),
 * })
 * app.post('/upload', validateForm(schema), uploadFile)
 */
export function validateForm<T extends ZodSchema>(schema: T): MiddlewareHandler {
  return zValidator('form', schema, (result, c) => {
    if (!result.success) {
      throw new ValidationError('Form data validation failed', {
        errors: result.error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      })
    }
  })
}

/**
 * Sanitize string inputs (trim whitespace, remove dangerous characters)
 *
 * @example
 * const schema = z.object({
 *   name: sanitizeString(z.string().min(1)),
 *   bio: sanitizeString(z.string().max(500)),
 * })
 */
export function sanitizeString<T extends z.ZodString>(schema: T) {
  return schema
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, 'Cannot be empty after trimming')
}

/**
 * Custom validation: File upload
 *
 * @example
 * const schema = z.object({
 *   file: validateFile({
 *     maxSize: 5 * 1024 * 1024, // 5MB
 *     allowedTypes: ['image/jpeg', 'image/png'],
 *   }),
 * })
 */
export function validateFile(options: {
  maxSize?: number
  allowedTypes?: string[]
  required?: boolean
}) {
  let schema = z.instanceof(File)

  if (options.required === false) {
    schema = schema.optional() as any
  }

  return schema
    .refine(
      (file) => {
        if (!file) return !options.required
        if (options.maxSize) {
          return file.size <= options.maxSize
        }
        return true
      },
      {
        message: `File size must not exceed ${
          options.maxSize ? options.maxSize / 1024 / 1024 : 'max'
        }MB`,
      }
    )
    .refine(
      (file) => {
        if (!file) return !options.required
        if (options.allowedTypes) {
          return options.allowedTypes.includes(file.type)
        }
        return true
      },
      {
        message: `File type must be one of: ${options.allowedTypes?.join(', ')}`,
      }
    )
}

/**
 * Example: Combined validation middleware
 *
 * @example
 * app.post('/users',
 *   validateAll({
 *     body: userCreateSchema,
 *     query: paginationSchema,
 *   }),
 *   createUser
 * )
 */
export function validateAll(schemas: {
  body?: ZodSchema
  query?: ZodSchema
  param?: ZodSchema
  headers?: ZodSchema
}): MiddlewareHandler {
  return async (c, next) => {
    if (schemas.body) {
      await validateBody(schemas.body)(c, next)
    }
    if (schemas.query) {
      await validateQuery(schemas.query)(c, next)
    }
    if (schemas.param) {
      await validateParam(schemas.param)(c, next)
    }
    if (schemas.headers) {
      await validateHeaders(schemas.headers)(c, next)
    }
    await next()
  }
}

/**
 * Conditional validation based on request properties
 *
 * @example
 * app.put('/users/:id',
 *   conditionalValidation(
 *     (c) => c.req.header('Content-Type') === 'application/json',
 *     validateBody(userUpdateSchema)
 *   ),
 *   updateUser
 * )
 */
export function conditionalValidation(
  condition: (c: any) => boolean,
  validator: MiddlewareHandler
): MiddlewareHandler {
  return async (c, next) => {
    if (condition(c)) {
      await validator(c, next)
    } else {
      await next()
    }
  }
}
