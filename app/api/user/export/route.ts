import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Fetch all user data
    const [user, portfolio, watchlist, preferences, activityLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          location: true,
          dateOfBirth: true,
          bio: true,
          website: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.portfolio.findMany({
        where: { userId: session.user.id },
      }),
      prisma.favorite.findMany({
        where: { userId: session.user.id },
        include: { instrument: true },
      }),
      prisma.userPreference.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.activityLog.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ])

    const exportData = {
      user: {
        ...user,
        dateOfBirth: user?.dateOfBirth?.toISOString(),
        createdAt: user?.createdAt.toISOString(),
        updatedAt: user?.updatedAt.toISOString(),
      },
      portfolio: portfolio.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      watchlist: watchlist.map(w => ({
        symbol: w.instrument.symbol,
        name: w.instrument.name,
        type: w.instrument.type,
        addedAt: w.createdAt.toISOString(),
      })),
      preferences,
      activityLogs: activityLogs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
      })),
      exportedAt: new Date().toISOString(),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("[Export] Error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}
