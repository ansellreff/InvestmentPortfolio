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
  dateOfBirth: z.union([z.string(), z.null()]).optional(),
  phone: z.union([z.string(), z.null()]).optional(),
  location: z.union([z.string(), z.null()]).optional(),
  timezone: z.union([z.string(), z.null()]).optional(),
}).transform((data) => ({
  ...data,
  // Convert empty strings to null for optional fields
  dateOfBirth: data.dateOfBirth && data.dateOfBirth.trim() !== "" ? data.dateOfBirth : null,
  phone: data.phone && data.phone.trim() !== "" ? data.phone : null,
  location: data.location && data.location.trim() !== "" ? data.location : null,
  timezone: data.timezone && data.timezone.trim() !== "" ? data.timezone : null,
}))

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
    const { email, password, name, dateOfBirth, phone, location, timezone } = signupSchema.parse(body)

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
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        phone,
        location,
        timezone,
        // First user becomes admin automatically
        isAdmin: isFirstUser,
        role: isFirstUser ? 'admin' : 'user',
      },
    })

    // Create default preferences
    await prisma.userPreference.create({
      data: {
        userId: user.id,
        defaultCurrency: "USD",
        theme: "system",
        language: "en",
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        description: "User account created",
      },
    })

    // Create email verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expires,
      },
    })

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
