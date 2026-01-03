/**
 * JWT Authentication Middleware for Hono
 *
 * Provides JWT-based authentication with token validation,
 * user extraction, and role-based access control.
 */

import { MiddlewareHandler } from 'hono'
import { jwt, JwtVariables } from 'hono/jwt'
import { UnauthorizedError, ForbiddenError } from '../utilities/error-types'

/**
 * JWT payload structure
 */
export interface JWTPayload {
  sub: string // User ID
  email: string
  role: string
  iat: number
  exp: number
}

/**
 * Variables to be added to context
 */
export type AuthVariables = {
  jwtPayload: JWTPayload
  user: {
    id: string
    email: string
    role: string
  }
}

/**
 * Basic JWT authentication middleware
 *
 * @example
 * app.use('/api/*', jwtAuth())
 */
export function jwtAuth(): MiddlewareHandler {
  return jwt({
    secret: process.env.JWT_SECRET!,
  })
}

/**
 * JWT authentication with user extraction
 *
 * @example
 * app.use('/api/*', extractUser())
 * app.get('/api/profile', (c) => {
 *   const user = c.get('user')
 *   return c.json(user)
 * })
 */
export function extractUser(): MiddlewareHandler {
  return async (c, next) => {
    // Get JWT payload set by jwt() middleware
    const payload = c.get('jwtPayload') as JWTPayload

    if (!payload) {
      throw new UnauthorizedError('No authentication token provided')
    }

    // Set user in context
    c.set('user', {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    })

    await next()
  }
}

/**
 * Role-based access control middleware
 *
 * @example
 * app.use('/admin/*', requireRole(['admin']))
 * app.use('/api/posts/:id', requireRole(['admin', 'editor']))
 */
export function requireRole(allowedRoles: string[]): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user')

    if (!user) {
      throw new UnauthorizedError('Authentication required')
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      )
    }

    await next()
  }
}

/**
 * Optional authentication middleware
 * Sets user if token is present, but doesn't require it
 *
 * @example
 * app.use('/api/posts', optionalAuth())
 * app.get('/api/posts', (c) => {
 *   const user = c.get('user') // May be undefined
 *   if (user) {
 *     // Return user-specific posts
 *   } else {
 *     // Return public posts
 *   }
 * })
 */
export function optionalAuth(): MiddlewareHandler {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization')

    if (authHeader?.startsWith('Bearer ')) {
      try {
        // Use jwt middleware
        await jwt({ secret: process.env.JWT_SECRET! })(c, next)

        // Extract user if token is valid
        const payload = c.get('jwtPayload') as JWTPayload
        if (payload) {
          c.set('user', {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
          })
        }
      } catch (error) {
        // Token is invalid, but that's okay for optional auth
        // Continue without setting user
      }
    }

    await next()
  }
}

/**
 * Verify token ownership middleware
 * Ensures the authenticated user owns the resource
 *
 * @example
 * app.put('/api/users/:id', verifyOwnership('id'), updateUser)
 */
export function verifyOwnership(paramName: string = 'id'): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user')
    const resourceId = c.req.param(paramName)

    if (!user) {
      throw new UnauthorizedError('Authentication required')
    }

    // Admin can access anything
    if (user.role === 'admin') {
      await next()
      return
    }

    // Check if user owns the resource
    if (user.id !== resourceId) {
      throw new ForbiddenError('You can only access your own resources')
    }

    await next()
  }
}

/**
 * Refresh token validation middleware
 *
 * @example
 * app.post('/auth/refresh', validateRefreshToken(), refreshAccessToken)
 */
export function validateRefreshToken(): MiddlewareHandler {
  return async (c, next) => {
    const refreshToken = c.req.header('X-Refresh-Token')

    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required')
    }

    try {
      // Verify refresh token (using different secret)
      const { verify } = await import('hono/jwt')
      const payload = await verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      )

      c.set('refreshPayload', payload)
      await next()
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token')
    }
  }
}

/**
 * Example: Combined authentication middleware
 *
 * @example
 * const auth = compose(
 *   jwtAuth(),
 *   extractUser()
 * )
 * app.use('/api/*', auth)
 */
export function authMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    await jwtAuth()(c, async () => {
      await extractUser()(c, next)
    })
  }
}
