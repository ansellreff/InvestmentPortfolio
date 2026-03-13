/**
 * Enhanced Validation Utilities
 * Centralized validation schemas and validators for user input
 */

import { z } from "zod"

// List of common disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
  'throwaway.email', 'fakeinbox.com', 'temp-mail.org', 'getairmail.com',
  'yopmail.com', 'maildrop.cc', 'sharklasers.com', ' guerrillamail.net',
  'trashmail.com', 'tempmail.net', 'incognitomail.com', 'deadspam.com',
  'spambox.us', 'junk.mx', 'meltmail.com', 'anonymbox.com',
  'dispostable.com', 'sendthisfile.com', 'trashmail.net', 'tempmail.co',
]

/**
 * Check if email is from a disposable email service
 */
export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  return DISPOSABLE_EMAIL_DOMAINS.some(disposable => domain.endsWith(disposable))
}

/**
 * Enhanced email schema with disposable email check
 */
export const emailSchema = z.string().email("Invalid email address").refine(
  (email) => !isDisposableEmail(email),
  "Please use a permanent email address"
)

/**
 * Password strength schema
 * Requires: 8+ chars, uppercase, lowercase, number, optional special char
 */
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters")
  .refine(password => /[a-z]/.test(password), "Password must contain at least one lowercase letter")
  .refine(password => /[A-Z]/.test(password), "Password must contain at least one uppercase letter")
  .refine(password => /\d/.test(password), "Password must contain at least one number")

/**
 * Strong password schema (includes special character requirement)
 */
export const strongPasswordSchema = z.string().min(8, "Password must be at least 8 characters")
  .refine(password => /[a-z]/.test(password), "Password must contain at least one lowercase letter")
  .refine(password => /[A-Z]/.test(password), "Password must contain at least one uppercase letter")
  .refine(password => /\d/.test(password), "Password must contain at least one number")
  .refine(password => /[^a-zA-Z0-9]/.test(password), "Password must contain at least one special character")

/**
 * Phone validation - supports international formats
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false // Empty is valid (optional field)

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Check if has reasonable length (7-15 digits)
  return digits.length >= 7 && digits.length <= 15
}

/**
 * Phone schema
 */
export const phoneSchema = z.string().optional().refine(
  (phone) => !phone || isValidPhone(phone),
  "Please enter a valid phone number"
)

/**
 * URL validation with HTTPS requirement
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * URL schema (HTTPS only)
 */
export const urlSchema = z.string().optional().refine(
  (url) => !url || isValidUrl(url),
  "URL must be valid and use HTTPS"
)

/**
 * HTTP URL schema (allows both HTTP and HTTPS)
 */
export const httpUrlSchema = z.string().optional().refine(
  (url) => !url || (() => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  })(),
  "Please enter a valid URL"
)

/**
 * Date of birth validation (18+ requirement)
 */
export function isValidDateOfBirth(dob: string | Date): boolean {
  const date = typeof dob === 'string' ? new Date(dob) : dob
  if (isNaN(date.getTime())) return false

  const today = new Date()
  const age = today.getFullYear() - date.getFullYear()
  const monthDiff = today.getMonth() - date.getMonth()

  // Adjust age if birthday hasn't occurred yet this year
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
    ? age - 1
    : age

  return actualAge >= 18
}

/**
 * Date of birth schema (18+)
 */
export const dateOfBirthSchema = z.string().optional().refine(
  (dob) => !dob || isValidDateOfBirth(dob),
  "You must be at least 18 years old"
)

/**
 * Name validation (letters, spaces, hyphens, apostrophes only)
 */
export const nameSchema = z.string().min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .refine(name => /^[a-zA-Z\u4e00-\u9fa5\u0400-\u04FF\u0590-\u05FF\s\-'\.]+$/.test(name),
    "Name can only contain letters, spaces, hyphens, and apostrophes")

/**
 * Location validation
 */
export const locationSchema = z.string().max(200, "Location must be less than 200 characters").optional()

/**
 * Bio validation
 */
export const bioSchema = z.string().max(500, "Bio must be less than 500 characters").optional()

/**
 * Timezone validation
 */
export const timezoneSchema = z.string().optional()

/**
 * Currency code validation (ISO 4217)
 */
export const currencySchema = z.string().length(3, "Currency code must be 3 characters").optional()

/**
 * Full user profile schema for updates
 */
export const userProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  location: locationSchema,
  dateOfBirth: dateOfBirthSchema,
  bio: bioSchema,
  website: urlSchema,
  timezone: timezoneSchema,
})

/**
 * Signup schema with enhanced validation
 */
export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  dateOfBirth: dateOfBirthSchema,
  phone: phoneSchema,
  location: locationSchema,
  timezone: timezoneSchema,
})

/**
 * Portfolio position schema
 */
export const portfolioPositionSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(20, "Symbol must be less than 20 characters"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  type: z.enum(["GOLD", "STOCK", "SILVER", "PLATINUM", "PALLADIUM", "CRYPTO"]),
  quantity: z.number().positive("Quantity must be positive"),
  avgBuyPrice: z.number().nonnegative("Average buy price cannot be negative"),
  currency: z.string().length(3, "Currency code must be 3 characters").default("USD"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
})

/**
 * Sanitize string input (remove HTML tags and trim)
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, '')
}

/**
 * Validate and sanitize name
 */
export function validateAndSanitizeName(name: string): { valid: boolean; sanitized?: string; error?: string } {
  const result = nameSchema.safeParse(name)
  if (result.success) {
    return { valid: true, sanitized: sanitizeString(name) }
  }
  return { valid: false, error: result.error.issues[0]?.message }
}

/**
 * Validate and sanitize bio
 */
export function validateAndSanitizeBio(bio: string): { valid: boolean; sanitized?: string; error?: string } {
  const result = bioSchema.safeParse(bio)
  if (result.success) {
    return { valid: true, sanitized: sanitizeString(bio) }
  }
  return { valid: false, error: result.error.issues[0]?.message }
}

/**
 * Calculate password strength score (0-5)
 */
export function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "Enter a password", color: "bg-slate-200" }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" }
  if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" }
  if (score <= 4) return { score, label: "Good", color: "bg-blue-500" }
  return { score, label: "Strong", color: "bg-green-500" }
}

/**
 * Validate symbol format (uppercase letters, numbers, dots, hyphens)
 */
export function isValidSymbol(symbol: string): boolean {
  return /^[A-Z0-9.\-]{1,20}$/.test(symbol)
}

/**
 * Symbol schema
 */
export const symbolSchema = z.string().min(1, "Symbol is required")
  .max(20, "Symbol must be less than 20 characters")
  .refine(isValidSymbol, "Symbol can only contain uppercase letters, numbers, dots, and hyphens")
