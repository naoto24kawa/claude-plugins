/**
 * Common Validation Schemas for Hono with Zod
 *
 * Reusable Zod schemas for common validation patterns.
 * Import and compose these schemas in your route validators.
 */

import { z } from 'zod'

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email format')

/**
 * Password validation (min 8 chars, requires uppercase, lowercase, number)
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL format')

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * Date string validation (ISO 8601)
 */
export const dateSchema = z.string().datetime('Invalid date format')

/**
 * Pagination query parameters
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
})

/**
 * Sorting query parameters
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  password: passwordSchema,
})

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

/**
 * User update schema (all fields optional)
 */
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: emailSchema.optional(),
  bio: z.string().max(500).optional(),
})

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
})

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
})

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  ...paginationSchema.shape,
  ...sortSchema.shape,
})

/**
 * Contact form schema
 */
export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(1000),
})

/**
 * File upload metadata schema
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  size: z.number().positive().max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
})

/**
 * API key schema
 */
export const apiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresAt: dateSchema.optional(),
})

/**
 * Webhook configuration schema
 */
export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').optional(),
})

/**
 * Generic create/update timestamp schema
 */
export const timestampSchema = z.object({
  createdAt: dateSchema,
  updatedAt: dateSchema,
})

/**
 * Error response schema (for API documentation)
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

/**
 * Success response schema (for API documentation)
 */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  })
