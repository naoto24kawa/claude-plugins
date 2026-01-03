/**
 * Complete Authentication Service Example with Hono
 *
 * Features:
 * - User registration
 * - User login (JWT)
 * - Token refresh
 * - Password reset
 * - Email verification
 * - Profile management
 * - Validation and error handling
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import { z } from 'zod'
import { validateBody } from '../../middleware/validation-zod'
import { authMiddleware } from '../../middleware/auth-jwt'
import { loggingMiddleware } from '../../middleware/logging'
import { errorHandler, notFoundHandler } from '../../middleware/error-handling'
import { success } from '../../utilities/response-helpers'
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from '../../utilities/error-types'

/**
 * Types
 */
interface User {
  id: string
  name: string
  email: string
  password: string // In production, store hashed password
  verified: boolean
  createdAt: string
  updatedAt: string
}

/**
 * In-memory database
 */
const users: Map<string, User> = new Map()
const refreshTokens: Map<string, string> = new Map() // token -> userId

/**
 * Environment variables
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'

/**
 * Validation schemas
 */
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
})

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
})

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

/**
 * Helper functions
 */
async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  return password // INSECURE: For example only!
}

async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  // In production, use bcrypt.compare
  return password === hashedPassword // INSECURE: For example only!
}

function generateTokens(userId: string, email: string, role: string = 'user') {
  const accessToken = sign(
    {
      sub: userId,
      email,
      role,
      exp: Math.floor(Date.now() / 1000) + 60 * 15, // 15 minutes
    },
    JWT_SECRET
  )

  const refreshToken = sign(
    {
      sub: userId,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    JWT_REFRESH_SECRET
  )

  return { accessToken, refreshToken }
}

/**
 * Auth routes
 */
const auth = new Hono()

/**
 * POST /auth/register
 * Register a new user
 */
auth.post('/register', validateBody(registerSchema), async (c) => {
  const data = c.req.valid('json')

  // Check if user already exists
  const existingUser = Array.from(users.values()).find(
    (u) => u.email === data.email
  )

  if (existingUser) {
    throw new ConflictError('User with this email already exists')
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password)

  // Create user
  const user: User = {
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    password: hashedPassword,
    verified: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  users.set(user.id, user)

  // Generate tokens
  const tokens = generateTokens(user.id, user.email)

  return success(
    c,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
      },
      ...tokens,
    },
    'Registration successful',
    201
  )
})

/**
 * POST /auth/login
 * Login with email and password
 */
auth.post('/login', validateBody(loginSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  // Find user
  const user = Array.from(users.values()).find((u) => u.email === email)

  if (!user) {
    throw new UnauthorizedError('Invalid credentials')
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password)

  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials')
  }

  // Generate tokens
  const tokens = generateTokens(user.id, user.email)

  // Store refresh token
  refreshTokens.set(tokens.refreshToken, user.id)

  return success(c, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      verified: user.verified,
    },
    ...tokens,
  })
})

/**
 * POST /auth/refresh
 * Refresh access token
 */
auth.post('/refresh', async (c) => {
  const refreshToken = c.req.header('X-Refresh-Token')

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token required')
  }

  // Verify refresh token
  let payload: any
  try {
    payload = await verify(refreshToken, JWT_REFRESH_SECRET)
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token')
  }

  const userId = refreshTokens.get(refreshToken)

  if (!userId || userId !== payload.sub) {
    throw new UnauthorizedError('Invalid refresh token')
  }

  const user = users.get(userId)

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  // Generate new tokens
  const tokens = generateTokens(user.id, user.email)

  // Update refresh token
  refreshTokens.delete(refreshToken)
  refreshTokens.set(tokens.refreshToken, user.id)

  return success(c, tokens)
})

/**
 * POST /auth/logout
 * Logout (invalidate refresh token)
 */
auth.post('/logout', authMiddleware(), async (c) => {
  const refreshToken = c.req.header('X-Refresh-Token')

  if (refreshToken) {
    refreshTokens.delete(refreshToken)
  }

  return success(c, null, 'Logged out successfully')
})

/**
 * POST /auth/verify-email
 * Verify email address
 */
auth.post('/verify-email', async (c) => {
  const { token } = await c.req.json()

  // In production, verify the token and update user
  // For now, just return success

  return success(c, null, 'Email verified successfully')
})

/**
 * POST /auth/reset-password/request
 * Request password reset
 */
auth.post(
  '/reset-password/request',
  validateBody(resetPasswordRequestSchema),
  async (c) => {
    const { email } = c.req.valid('json')

    const user = Array.from(users.values()).find((u) => u.email === email)

    // Always return success (security: don't reveal if email exists)
    return success(
      c,
      null,
      'If the email exists, a reset link has been sent'
    )
  }
)

/**
 * POST /auth/reset-password
 * Reset password with token
 */
auth.post('/reset-password', validateBody(resetPasswordSchema), async (c) => {
  const { token, password } = c.req.valid('json')

  // In production, verify the token and find user
  // For now, just return success

  return success(c, null, 'Password reset successfully')
})

/**
 * Profile routes
 */
const profile = new Hono()

// Require authentication
profile.use('*', authMiddleware())

/**
 * GET /profile
 * Get current user profile
 */
profile.get('/', async (c) => {
  const currentUser = c.get('user')
  const user = users.get(currentUser.id)

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  return success(c, {
    id: user.id,
    name: user.name,
    email: user.email,
    verified: user.verified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  })
})

/**
 * PUT /profile
 * Update user profile
 */
profile.put('/', validateBody(updateProfileSchema), async (c) => {
  const currentUser = c.get('user')
  const data = c.req.valid('json')

  const user = users.get(currentUser.id)

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  // Check email uniqueness if changing
  if (data.email && data.email !== user.email) {
    const existingUser = Array.from(users.values()).find(
      (u) => u.email === data.email
    )

    if (existingUser) {
      throw new ConflictError('Email already in use')
    }
  }

  // Update user
  const updatedUser: User = {
    ...user,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  users.set(user.id, updatedUser)

  return success(
    c,
    {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      verified: updatedUser.verified,
      updatedAt: updatedUser.updatedAt,
    },
    'Profile updated successfully'
  )
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
app.route('/api/auth', auth)
app.route('/api/profile', profile)

// Error handlers
app.onError(errorHandler)
app.notFound(notFoundHandler)

export default app
