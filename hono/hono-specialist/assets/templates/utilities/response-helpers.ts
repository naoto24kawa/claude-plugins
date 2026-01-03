/**
 * Standardized API Response Helpers for Hono
 *
 * Provides consistent response formatting across your API.
 * Use these helpers to ensure uniform response structure.
 */

import { Context } from 'hono'

/**
 * Success response structure
 */
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T = any> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Send a successful JSON response
 *
 * @example
 * return success(c, { id: 1, name: 'John' })
 * return success(c, user, 'User created successfully', 201)
 */
export function success<T>(
  c: Context,
  data: T,
  message?: string,
  status: number = 200
) {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  }

  if (message) {
    response.message = message
  }

  return c.json(response, status)
}

/**
 * Send an error JSON response
 *
 * @example
 * return error(c, 'NOT_FOUND', 'User not found', 404)
 * return error(c, 'VALIDATION_ERROR', 'Invalid input', 400, { field: 'email' })
 */
export function error(
  c: Context,
  code: string,
  message: string,
  status: number = 400,
  details?: any
) {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  }

  if (details) {
    response.error.details = details
  }

  return c.json(response, status)
}

/**
 * Send a paginated response
 *
 * @example
 * return paginated(c, users, { page: 1, limit: 10, total: 100 })
 */
export function paginated<T>(
  c: Context,
  data: T[],
  pagination: {
    page: number
    limit: number
    total: number
  }
) {
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages,
    },
  }

  return c.json(response)
}

/**
 * Send a 404 Not Found response
 *
 * @example
 * return notFound(c, 'User not found')
 */
export function notFound(c: Context, message: string = 'Resource not found') {
  return error(c, 'NOT_FOUND', message, 404)
}

/**
 * Send a 401 Unauthorized response
 *
 * @example
 * return unauthorized(c, 'Invalid credentials')
 */
export function unauthorized(c: Context, message: string = 'Unauthorized') {
  return error(c, 'UNAUTHORIZED', message, 401)
}

/**
 * Send a 403 Forbidden response
 *
 * @example
 * return forbidden(c, 'You do not have permission to access this resource')
 */
export function forbidden(c: Context, message: string = 'Forbidden') {
  return error(c, 'FORBIDDEN', message, 403)
}

/**
 * Send a 422 Unprocessable Entity response (validation errors)
 *
 * @example
 * return validationError(c, { email: 'Invalid email format' })
 */
export function validationError(c: Context, details: any) {
  return error(c, 'VALIDATION_ERROR', 'Validation failed', 422, details)
}

/**
 * Send a 500 Internal Server Error response
 *
 * @example
 * return serverError(c, 'An unexpected error occurred')
 */
export function serverError(c: Context, message: string = 'Internal server error') {
  return error(c, 'INTERNAL_ERROR', message, 500)
}

/**
 * Send a 204 No Content response
 *
 * @example
 * return noContent(c)
 */
export function noContent(c: Context) {
  return c.body(null, 204)
}
