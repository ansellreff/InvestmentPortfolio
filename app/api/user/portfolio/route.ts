import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { apiRateLimit } from "@/lib/utils/rateLimit"
import { logger } from "@/lib/utils/logger"
import { sanitizeString } from "@/lib/validation/validators"

const portfolioItemSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(20, "Symbol must be less than 20 characters").regex(/^[A-Z0-9.\-]+$/, "Symbol can only contain uppercase letters, numbers, dots, and hyphens"),
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  type: z.enum(["GOLD", "STOCK", "SILVER", "PLATINUM", "PALLADIUM", "CRYPTO"]),
  quantity: z.number().positive("Quantity must be positive"),
  avgBuyPrice: z.number().nonnegative("Average buy price cannot be negative"),
  currency: z.string().length(3, "Currency must be a 3-letter code").default("USD"),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
})

// GET user's portfolio
export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimit.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: portfolio.map((p) => ({
        id: p.id,
        symbol: p.symbol,
        name: p.name,
        type: p.type,
        quantity: p.quantity,
        avgBuyPrice: p.avgBuyPrice,
        currency: p.currency,
        notes: p.notes,
        addedAt: p.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error("[Portfolio] Error fetching portfolio:", error)
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    )
  }
}

// POST - Add portfolio position
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimit.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const data = portfolioItemSchema.parse(body)

    // Sanitize string inputs
    const sanitizedData = {
      symbol: data.symbol.toUpperCase().trim(),
      name: sanitizeString(data.name),
      type: data.type,
      quantity: data.quantity,
      avgBuyPrice: data.avgBuyPrice,
      currency: data.currency.toUpperCase().trim(),
      notes: data.notes ? sanitizeString(data.notes) : undefined,
    }

    // Check if position already exists
    const existing = await prisma.portfolio.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: data.symbol,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Position already exists. Use PUT to update." },
        { status: 400 }
      )
    }

    // Create portfolio position
    const position = await prisma.portfolio.create({
      data: {
        userId: session.user.id,
        ...sanitizedData,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: position.id,
        ...data,
        addedAt: position.createdAt.toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    logger.error("[Portfolio] Error adding position:", error)
    return NextResponse.json(
      { error: "Failed to add position" },
      { status: 500 }
    )
  }
}

// PUT - Update portfolio position
export async function PUT(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimit.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()
    const { symbol, ...updateData } = body
    const data = portfolioItemSchema.partial().parse(updateData)

    // Sanitize string inputs
    const sanitizedData: Record<string, unknown> = {}
    if (data.name) sanitizedData.name = sanitizeString(data.name)
    if (data.currency) sanitizedData.currency = data.currency.toUpperCase().trim()
    if (data.notes) sanitizedData.notes = sanitizeString(data.notes)
    if (data.quantity !== undefined) sanitizedData.quantity = data.quantity
    if (data.avgBuyPrice !== undefined) sanitizedData.avgBuyPrice = data.avgBuyPrice
    if (data.type !== undefined) sanitizedData.type = data.type

    // Find existing position
    const existing = await prisma.portfolio.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      )
    }

    // Update position
    const updated = await prisma.portfolio.update({
      where: { id: existing.id },
      data: sanitizedData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        symbol: updated.symbol,
        name: updated.name,
        type: updated.type,
        quantity: updated.quantity,
        avgBuyPrice: updated.avgBuyPrice,
        currency: updated.currency,
        notes: updated.notes,
      },
    })
  } catch (error) {
    logger.error("[Portfolio] Error updating position:", error)
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    )
  }
}

// DELETE - Remove portfolio position
export async function DELETE(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (!apiRateLimit.check(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol")

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      )
    }

    await prisma.portfolio.deleteMany({
      where: {
        userId: session.user.id,
        symbol,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("[Portfolio] Error deleting position:", error)
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    )
  }
}
