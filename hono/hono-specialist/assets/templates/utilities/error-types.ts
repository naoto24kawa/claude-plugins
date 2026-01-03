/**
 * Custom Error Types for Hono
 *
 * Provides type-safe custom errors for common scenarios.
 * Use with HTTPException for proper error handling.
 */

import { HTTPException } from 'hono/http-exception'

/**
 * Base application error
 */
export class AppError extends HTTPException {
  constructor(
    status: number,
    message: string,
    public code: string,
    public details?: any
  ) {
    super(status, { message })
    this.name = 'AppError'
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    }
  }
}

/**
 * Validation error (422)
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(422, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(404, message, 'NOT_FOUND', details)
    this.name = 'NotFoundError'
  }
}

/**
 * Unauthorized error (401)
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(401, message, 'UNAUTHORIZED', details)
    this.name = 'UnauthorizedError'
  }
}

/**
 * Forbidden error (403)
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(403, message, 'FORBIDDEN', details)
    this.name = 'ForbiddenError'
  }
}

/**
 * Conflict error (409) - e.g., duplicate resource
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(409, message, 'CONFLICT', details)
    this.name = 'ConflictError'
  }
}

/**
 * Bad request error (400)
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(400, message, 'BAD_REQUEST', details)
    this.name = 'BadRequestError'
  }
}

/**
 * Too many requests error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests', details?: any) {
    super(429, message, 'RATE_LIMIT_EXCEEDED', details)
    this.name = 'RateLimitError'
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, 'INTERNAL_ERROR', details)
    this.name = 'InternalError'
  }
}

/**
 * Service unavailable error (503)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(503, message, 'SERVICE_UNAVAILABLE', details)
    this.name = 'ServiceUnavailableError'
  }
}

/**
 * Database error
 */
export class DatabaseError extends InternalError {
  constructor(message: string = 'Database error', details?: any) {
    super(message, details)
    this.code = 'DATABASE_ERROR'
    this.name = 'DatabaseError'
  }
}

/**
 * External API error
 */
export class ExternalAPIError extends InternalError {
  constructor(message: string = 'External API error', details?: any) {
    super(message, details)
    this.code = 'EXTERNAL_API_ERROR'
    this.name = 'ExternalAPIError'
  }
}

/**
 * Error handler for use in Hono error middleware
 *
 * @example
 * app.onError((err, c) => {
 *   return handleError(err, c)
 * })
 */
export function handleError(err: Error, c: any) {
  console.error('Error:', err)

  if (err instanceof AppError) {
    return c.json(err.toJSON(), err.status)
  }

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

  // Unknown error
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    500
  )
}
