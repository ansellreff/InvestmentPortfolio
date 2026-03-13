import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { logger } from "@/lib/utils/logger"
import { sanitizeString } from "@/lib/validation/validators"

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters").optional(),
  phone: z.string().refine(
    (phone) => !phone || /^\+?[\d\s\-()]+$/.test(phone),
    "Please enter a valid phone number"
  ).optional(),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  dateOfBirth: z.string().refine(
    (dob) => !dob || !isNaN(Date.parse(dob)),
    "Please enter a valid date"
  ).refine(
    (dob) => {
      if (!dob) return true
      const date = new Date(dob)
      const today = new Date()
      const age = today.getFullYear() - date.getFullYear()
      return age >= 18
    },
    "You must be at least 18 years old"
  ).optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Please enter a valid URL").refine(
    (url) => !url || url.startsWith('https://'),
    "Website URL must use HTTPS"
  ).optional(),
})

// GET user profile
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        phone: true,
        location: true,
        dateOfBirth: true,
        bio: true,
        website: true,
        timezone: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      },
    })
  } catch (error) {
    logger.error("[Profile] Error fetching profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

// PUT update user profile
export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = profileSchema.parse(body)

    // Sanitize string inputs to prevent XSS
    const sanitizedData = {
      name: data.name ? sanitizeString(data.name) : undefined,
      phone: data.phone ? data.phone.trim() : undefined,
      location: data.location ? sanitizeString(data.location) : undefined,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      bio: data.bio ? sanitizeString(data.bio) : undefined,
      website: data.website ? data.website.trim() : undefined,
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: sanitizedData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        location: true,
        dateOfBirth: true,
        bio: true,
        website: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PROFILE_UPDATED",
        description: "User profile updated",
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...updatedUser,
        dateOfBirth: updatedUser.dateOfBirth ? updatedUser.dateOfBirth.toISOString() : null,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    logger.error("[Profile] Error updating profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
