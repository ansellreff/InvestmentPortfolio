import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET user's watchlist
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { instrument: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: favorites.map((f) => ({
        symbol: f.instrument.symbol,
        name: f.instrument.name,
        type: f.instrument.type,
        addedAt: f.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[Watchlist] Error fetching watchlist:", error)
    return NextResponse.json(
      { error: "Failed to fetch watchlist" },
      { status: 500 }
    )
  }
}

// POST - Add to watchlist
export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { symbol, name, type } = await req.json()

    if (!symbol) {
      return NextResponse.json(
        { error: "Symbol is required" },
        { status: 400 }
      )
    }

    // Find or create instrument
    let instrument = await prisma.instrument.findUnique({
      where: { symbol },
    })

    if (!instrument) {
      instrument = await prisma.instrument.create({
        data: {
          symbol,
          name: name || symbol,
          type: type || "STOCK",
        },
      })
    }

    // Check if already in favorites
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_instrumentId: {
          userId: session.user.id,
          instrumentId: instrument.id,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Already in watchlist" },
        { status: 400 }
      )
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        instrumentId: instrument.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        symbol: instrument.symbol,
        name: instrument.name,
        type: instrument.type,
        addedAt: favorite.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("[Watchlist] Error adding to watchlist:", error)
    return NextResponse.json(
      { error: "Failed to add to watchlist" },
      { status: 500 }
    )
  }
}

// DELETE - Remove from watchlist
export async function DELETE(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    // Find instrument
    const instrument = await prisma.instrument.findUnique({
      where: { symbol },
    })

    if (!instrument) {
      return NextResponse.json(
        { error: "Instrument not found" },
        { status: 404 }
      )
    }

    // Delete favorite
    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        instrumentId: instrument.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Watchlist] Error removing from watchlist:", error)
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    )
  }
}
