import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authRateLimit } from "@/lib/utils/rateLimit"
import { logger } from "@/lib/utils/logger"
import crypto from "crypto"

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  dateOfBirth: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  captchaToken: z.string().optional(),
})

export async function POST(req: NextRequest) {
  // Rate limiting - prevent signup abuse
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!authRateLimit.check(ip)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    logger.info("[Signup] Received data:", { email: body.email, name: body.name })

    const rawData = signupSchema.parse(body)
    logger.info("[Signup] Validated data:", { ...rawData, password: "***" })

    // Convert empty strings to null for optional fields
    const cleanData = {
      ...rawData,
      dateOfBirth: (rawData.dateOfBirth && rawData.dateOfBirth.trim()) ? rawData.dateOfBirth.trim() : null,
      phone: (rawData.phone && rawData.phone.trim()) ? rawData.phone.trim() : null,
      location: (rawData.location && rawData.location.trim()) ? rawData.location.trim() : null,
      timezone: (rawData.timezone && rawData.timezone.trim()) ? rawData.timezone.trim() : null,
    }

    const { email, password, name, dateOfBirth, phone, location, timezone } = cleanData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Count existing users - first user becomes admin
    const userCount = await prisma.user.count()
    const isFirstUser = userCount === 0

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user with profile data
    let user
    try {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          phone: phone || null,
          location: location || null,
          timezone: timezone || null,
          // First user becomes admin automatically
          isAdmin: isFirstUser,
          role: isFirstUser ? 'admin' : 'user',
        },
      })
    } catch (dbError: any) {
      logger.error("[Signup] Database error creating user:", dbError)
      return NextResponse.json(
        { error: "Failed to create user account", details: dbError.message },
        { status: 500 }
      )
    }

    // Create default preferences
    try {
      await prisma.userPreference.create({
        data: {
          userId: user.id,
          defaultCurrency: "USD",
          theme: "system",
          language: "en",
        },
      })
    } catch (prefError: any) {
      logger.error("[Signup] Database error creating preferences:", prefError)
      // Continue anyway, this is not critical
    }

    // Log activity
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTERED",
          description: "User account created",
        },
      })
    } catch (logError: any) {
      logger.error("[Signup] Database error creating activity log:", logError)
      // Continue anyway, this is not critical
    }

    // Create email verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    try {
      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          email: user.email,
          token,
          expires,
        },
      })
    } catch (tokenError: any) {
      logger.error("[Signup] Database error creating verification token:", tokenError)
      // Continue anyway, user is created
    }

    // Send verification email
    try {
      const { sendVerificationEmail } = await import('@/lib/email')
      const emailSent = await sendVerificationEmail(user.email, token)

      if (emailSent) {
        logger.info(`Verification email sent to ${user.email}`)
      } else {
        logger.warn(`Failed to send verification email to ${user.email}`)
      }
    } catch (emailError) {
      logger.error('Error sending verification email:', emailError)
      // Continue with signup even if email fails
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        message: isFirstUser
          ? "Welcome! As the first user, you have been granted admin privileges. Please check your email to verify your account."
          : "Account created successfully. Please check your email to verify your account.",
        requireVerification: true,
        isFirstUser,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    logger.error("[Signup] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
