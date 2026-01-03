/**
 * Logging Middleware for Hono
 *
 * Provides structured logging with request/response tracking,
 * performance monitoring, and error logging.
 */

import { MiddlewareHandler } from 'hono'

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  requestId?: string
  userId?: string
  method?: string
  path?: string
  status?: number
  duration?: number
  userAgent?: string
  ip?: string
  error?: any
  [key: string]: any
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, data?: any): void
  info(message: string, data?: any): void
  warn(message: string, data?: any): void
  error(message: string, error?: any, data?: any): void
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      ...data,
    }

    const logFn = level === LogLevel.ERROR ? console.error : console.log
    logFn(JSON.stringify(entry))
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: any, data?: any) {
    this.log(LogLevel.ERROR, message, {
      ...data,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    })
  }
}

/**
 * Global logger instance
 */
export const logger = new ConsoleLogger()

/**
 * Request ID middleware
 * Generates a unique ID for each request
 *
 * @example
 * app.use('*', requestId())
 */
export function requestId(): MiddlewareHandler {
  return async (c, next) => {
    const id = crypto.randomUUID()
    c.set('requestId', id)
    c.res.headers.set('X-Request-ID', id)
    await next()
  }
}

/**
 * Request logging middleware
 * Logs incoming requests with timing
 *
 * @example
 * app.use('*', requestLogger())
 */
export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now()
    const requestId = c.get('requestId') || crypto.randomUUID()
    const user = c.get('user')

    // Log request start
    logger.info('Request received', {
      requestId,
      userId: user?.id,
      method: c.req.method,
      path: c.req.path,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
    })

    try {
      await next()
    } finally {
      // Log request completion
      const duration = Date.now() - start

      logger.info('Request completed', {
        requestId,
        userId: user?.id,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration,
      })
    }
  }
}

/**
 * Error logging middleware
 * Logs errors with full context
 *
 * @example
 * app.use('*', errorLogger())
 */
export function errorLogger(): MiddlewareHandler {
  return async (c, next) => {
    const requestId = c.get('requestId')
    const user = c.get('user')

    try {
      await next()
    } catch (error) {
      logger.error('Request error', error, {
        requestId,
        userId: user?.id,
        method: c.req.method,
        path: c.req.path,
      })

      throw error
    }
  }
}

/**
 * Performance monitoring middleware
 * Logs slow requests (>1000ms by default)
 *
 * @example
 * app.use('*', performanceMonitor(500)) // Log requests >500ms
 */
export function performanceMonitor(threshold: number = 1000): MiddlewareHandler {
  return async (c, next) => {
    const start = Date.now()

    await next()

    const duration = Date.now() - start

    if (duration > threshold) {
      logger.warn('Slow request detected', {
        requestId: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        duration,
        threshold,
      })
    }
  }
}

/**
 * Database query logging middleware
 * Use this in database adapters to log queries
 *
 * @example
 * const result = await logQuery('SELECT * FROM users WHERE id = ?', [userId])
 */
export async function logQuery<T>(
  query: string,
  params: any[],
  executor: () => Promise<T>
): Promise<T> {
  const start = Date.now()

  logger.debug('Database query', {
    query,
    params,
  })

  try {
    const result = await executor()
    const duration = Date.now() - start

    logger.debug('Database query completed', {
      query,
      duration,
    })

    return result
  } catch (error) {
    logger.error('Database query failed', error, {
      query,
      params,
    })
    throw error
  }
}

/**
 * Redact sensitive data from logs
 *
 * @example
 * logger.info('User data', redact(userData, ['password', 'creditCard']))
 */
export function redact(obj: any, keys: string[]): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  const redacted = { ...obj }

  for (const key of keys) {
    if (key in redacted) {
      redacted[key] = '[REDACTED]'
    }
  }

  return redacted
}

/**
 * Combined logging middleware
 * Applies requestId, requestLogger, and errorLogger
 *
 * @example
 * app.use('*', loggingMiddleware())
 */
export function loggingMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    await requestId()(c, async () => {
      await requestLogger()(c, async () => {
        await errorLogger()(c, next)
      })
    })
  }
}
