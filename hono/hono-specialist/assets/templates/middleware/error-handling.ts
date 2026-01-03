/**
 * Error Handling Middleware for Hono
 *
 * Provides centralized error handling with proper HTTP responses,
 * logging, and error transformation.
 */

import { ErrorHandler, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { AppError, ValidationError } from '../utilities/error-types'
import { logger } from './logging'

/**
 * Global error handler
 * Catches all errors and returns proper JSON responses
 *
 * @example
 * app.onError(errorHandler)
 */
export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get('requestId')
  const user = c.get('user')

  // Log error with context
  logger.error('Error occurred', err, {
    requestId,
    userId: user?.id,
    method: c.req.method,
    path: c.req.path,
  })

  // Handle AppError (custom errors)
  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.status)
  }

  // Handle HTTPException
  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: 'HTTP_EXCEPTION',
          message: err.message,
        },
      },
      err.status
    )
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: err.issues || err.errors,
        },
      },
      422
    )
  }

  // Handle unknown errors
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'

  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: isDevelopment
          ? err.message
          : 'An unexpected error occurred',
        ...(isDevelopment && { stack: err.stack }),
      },
    },
    500
  )
}

/**
 * Not found handler
 * Returns 404 for unmatched routes
 *
 * @example
 * app.notFound(notFoundHandler)
 */
export const notFoundHandler: MiddlewareHandler = (c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  )
}

/**
 * Try-catch wrapper for async handlers
 * Automatically catches errors and passes to error handler
 *
 * @example
 * app.get('/users', asyncHandler(async (c) => {
 *   const users = await db.users.findMany()
 *   return c.json(users)
 * }))
 */
export function asyncHandler(
  handler: (c: any) => Promise<Response>
): MiddlewareHandler {
  return async (c, next) => {
    try {
      return await handler(c)
    } catch (error) {
      throw error
    }
  }
}

/**
 * Error boundary middleware
 * Catches errors and transforms them
 *
 * @example
 * app.use('*', errorBoundary())
 */
export function errorBoundary(): MiddlewareHandler {
  return async (c, next) => {
    try {
      await next()
    } catch (error) {
      // Transform error if needed
      if (error instanceof Error) {
        // Check for specific error patterns and transform
        if (error.message.includes('UNIQUE constraint failed')) {
          throw new AppError(
            409,
            'A record with this information already exists',
            'DUPLICATE_ENTRY'
          )
        }

        if (error.message.includes('FOREIGN KEY constraint failed')) {
          throw new AppError(
            400,
            'Referenced resource does not exist',
            'INVALID_REFERENCE'
          )
        }
      }

      throw error
    }
  }
}

/**
 * Rate limit error handler
 * Handles rate limiting errors with proper retry-after header
 *
 * @example
 * if (isRateLimited) {
 *   throw createRateLimitError(60) // Retry after 60 seconds
 * }
 */
export function createRateLimitError(retryAfter: number): AppError {
  return new AppError(
    429,
    `Rate limit exceeded. Retry after ${retryAfter} seconds`,
    'RATE_LIMIT_EXCEEDED',
    { retryAfter }
  )
}

/**
 * Validation error formatter
 * Formats Zod errors into user-friendly messages
 *
 * @example
 * const result = schema.safeParse(data)
 * if (!result.success) {
 *   throw formatValidationError(result.error)
 * }
 */
export function formatValidationError(error: any): ValidationError {
  const formatted = error.errors.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return new ValidationError('Validation failed', {
    errors: formatted,
  })
}

/**
 * Database error handler
 * Transforms database errors into user-friendly messages
 *
 * @example
 * try {
 *   await db.insert(data)
 * } catch (error) {
 *   throw handleDatabaseError(error)
 * }
 */
export function handleDatabaseError(error: any): AppError {
  // PostgreSQL errors
  if (error.code === '23505') {
    return new AppError(
      409,
      'A record with this information already exists',
      'DUPLICATE_ENTRY'
    )
  }

  if (error.code === '23503') {
    return new AppError(
      400,
      'Referenced resource does not exist',
      'INVALID_REFERENCE'
    )
  }

  // SQLite errors
  if (error.message?.includes('UNIQUE constraint failed')) {
    return new AppError(
      409,
      'A record with this information already exists',
      'DUPLICATE_ENTRY'
    )
  }

  if (error.message?.includes('FOREIGN KEY constraint failed')) {
    return new AppError(
      400,
      'Referenced resource does not exist',
      'INVALID_REFERENCE'
    )
  }

  // Generic database error
  logger.error('Database error', error)
  return new AppError(
    500,
    'A database error occurred',
    'DATABASE_ERROR'
  )
}

/**
 * External API error handler
 * Handles errors from external API calls
 *
 * @example
 * try {
 *   const response = await fetch(externalAPI)
 * } catch (error) {
 *   throw handleExternalAPIError(error, 'GitHub API')
 * }
 */
export function handleExternalAPIError(
  error: any,
  serviceName: string
): AppError {
  logger.error(`${serviceName} error`, error)

  return new AppError(
    502,
    `Failed to communicate with ${serviceName}`,
    'EXTERNAL_API_ERROR',
    { service: serviceName }
  )
}

/**
 * Combined error handling middleware
 * Applies errorBoundary and other error handlers
 *
 * @example
 * app.use('*', errorHandlingMiddleware())
 * app.onError(errorHandler)
 * app.notFound(notFoundHandler)
 */
export function errorHandlingMiddleware(): MiddlewareHandler {
  return errorBoundary()
}
