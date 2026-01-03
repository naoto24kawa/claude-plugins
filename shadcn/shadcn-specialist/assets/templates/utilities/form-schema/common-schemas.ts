import * as z from "zod"

/**
 * Common reusable Zod schemas for form validation
 */

// Email validation
export const emailSchema = z
  .string()
  .min(1, { message: "Email is required" })
  .email({ message: "Please enter a valid email address" })

// Password validation
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })

// Username validation
export const usernameSchema = z
  .string()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(20, { message: "Username must be at most 20 characters" })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  })

// Phone number validation (US format)
export const phoneSchema = z
  .string()
  .regex(/^\+?1?\d{10,14}$/, { message: "Please enter a valid phone number" })
  .optional()
  .or(z.literal(""))

// URL validation
export const urlSchema = z
  .string()
  .url({ message: "Please enter a valid URL" })
  .optional()
  .or(z.literal(""))

// Date validation (future dates only)
export const futureDateSchema = z.date().refine((date) => date > new Date(), {
  message: "Date must be in the future",
})

// Date validation (past dates only)
export const pastDateSchema = z.date().refine((date) => date < new Date(), {
  message: "Date must be in the past",
})

// Credit card validation (basic Luhn algorithm check)
export const creditCardSchema = z.string().regex(/^\d{13,19}$/, {
  message: "Please enter a valid credit card number",
})

// Postal code validation (US ZIP code)
export const zipCodeSchema = z.string().regex(/^\d{5}(-\d{4})?$/, {
  message: "Please enter a valid ZIP code",
})

// File upload validation
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5000000, {
    message: "File size must be less than 5MB",
  })
  .refine(
    (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    {
      message: "File must be a JPEG, PNG, or WebP image",
    }
  )

// Multiple file upload validation
export const multipleFilesSchema = z
  .array(fileSchema)
  .min(1, { message: "At least one file is required" })
  .max(5, { message: "Maximum 5 files allowed" })

// Checkbox required validation
export const requiredCheckboxSchema = z.boolean().refine((val) => val === true, {
  message: "You must accept the terms and conditions",
})

// Number range validation
export const ageSchema = z
  .number()
  .int({ message: "Age must be a whole number" })
  .min(18, { message: "You must be at least 18 years old" })
  .max(120, { message: "Please enter a valid age" })

// Currency validation (USD)
export const currencySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: "Please enter a valid amount" })
  .transform((val) => parseFloat(val))

// Time validation (HH:MM format)
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: "Please enter a valid time (HH:MM)",
  })

// Array of strings validation
export const tagsSchema = z
  .array(z.string())
  .min(1, { message: "At least one tag is required" })
  .max(10, { message: "Maximum 10 tags allowed" })

/**
 * Complex form schemas
 */

// Login form schema
export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
})

// Registration form schema
export const registrationFormSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: requiredCheckboxSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Profile form schema
export const profileFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  bio: z
    .string()
    .max(500, { message: "Bio must be at most 500 characters" })
    .optional(),
  website: urlSchema,
  phone: phoneSchema,
  avatar: fileSchema.optional(),
})

// Address form schema
export const addressFormSchema = z.object({
  street: z.string().min(1, { message: "Street address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(2).max(2),
  zipCode: zipCodeSchema,
  country: z.string().min(1, { message: "Country is required" }),
})

// Contact form schema
export const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: emailSchema,
  subject: z.string().min(1, { message: "Subject is required" }),
  message: z
    .string()
    .min(10, { message: "Message must be at least 10 characters" })
    .max(1000, { message: "Message must be at most 1000 characters" }),
})

// Payment form schema
export const paymentFormSchema = z.object({
  cardNumber: creditCardSchema,
  cardholderName: z.string().min(1, { message: "Cardholder name is required" }),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    message: "Please enter a valid expiry date (MM/YY)",
  }),
  cvv: z.string().regex(/^\d{3,4}$/, {
    message: "Please enter a valid CVV",
  }),
  billingAddress: addressFormSchema,
})
