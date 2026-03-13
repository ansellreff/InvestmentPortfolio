import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const preferencesSchema = z.object({
  defaultCurrency: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
})

// GET user preferences
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let preferences = await prisma.userPreference.findUnique({
      where: { userId: session.user.id },
    })

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: {
          userId: session.user.id,
          defaultCurrency: "USD",
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        defaultCurrency: preferences.defaultCurrency,
        theme: preferences.theme,
        language: preferences.language,
      },
    })
  } catch (error) {
    console.error("[Preferences] Error fetching preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    )
  }
}

// PUT - Update user preferences
export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = preferencesSchema.parse(body)

    // Upsert preferences
    const preferences = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...data,
      },
      update: data,
    })

    return NextResponse.json({
      success: true,
      data: {
        defaultCurrency: preferences.defaultCurrency,
        theme: preferences.theme,
        language: preferences.language,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[Preferences] Error updating preferences:", error)
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    )
  }
}
