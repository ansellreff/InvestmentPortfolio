import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authRateLimit } from "@/lib/utils/rateLimit"
import { logger } from "@/lib/utils/logger"

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  // Optional fields - accept string, null, or undefined
  dateOfBirth: z.union([z.string(), z.null(), z.undefined()]).optional(),
  phone: z.union([z.string(), z.null(), z.undefined()]).optional(),
  location: z.union([z.string(), z.null(), z.undefined()]).optional(),
  timezone: z.union([z.string(), z.null(), z.undefined()]).optional(),
})

// Helper to clean optional fields (convert empty strings to null)
function cleanOptionalField(val: string | null | undefined): string | null {
  if (!val || val.trim() === "") return null
  return val.trim()
}

export async function POST(req: NextRequest) {
  // Rate limiting - prevent signup abuse
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
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

    const { email, password, name, dateOfBirth, phone, location, timezone } = rawData

    // Clean optional fields (convert empty strings to null)
    const cleanedData = {
      dateOfBirth: cleanOptionalField(dateOfBirth),
      phone: cleanOptionalField(phone),
      location: cleanOptionalField(location),
      timezone: cleanOptionalField(timezone),
    }

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
        dateOfBirth: cleanedData.dateOfBirth ? new Date(cleanedData.dateOfBirth) : null,
        phone: cleanedData.phone,
        location: cleanedData.location,
        timezone: cleanedData.timezone,
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
    }).catch(err => {
      logger.error("[Signup] Failed to create preferences:", err)
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_REGISTERED",
        description: "User account created",
      },
    }).catch(err => {
      logger.error("[Signup] Failed to create activity log:", err)
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
        },
        message: isFirstUser
          ? "Welcome! As the first user, you have been granted admin privileges."
          : "Account created successfully!",
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
