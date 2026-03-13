import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Fetch all data
    const [users, portfolios, favorites, preferences, instruments, prices, activities] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          role: true,
          phone: true,
          location: true,
          dateOfBirth: true,
          bio: true,
          website: true,
          createdAt: true,
          lastLoginAt: true,
        },
      }),
      prisma.portfolio.findMany(),
      prisma.favorite.findMany(),
      prisma.userPreference.findMany(),
      prisma.instrument.findMany(),
      prisma.price.findMany({ take: 1000, orderBy: { timestamp: "desc" } }),
      prisma.activityLog.findMany({ take: 1000, orderBy: { createdAt: "desc" } }),
    ])

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        totalUsers: users.length,
        totalPortfolios: portfolios.length,
        totalFavorites: favorites.length,
      },
      users: users.map(u => ({
        ...u,
        password: "[REDACTED]",
        dateOfBirth: u.dateOfBirth?.toISOString(),
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt?.toISOString(),
      })),
      portfolios,
      favorites,
      preferences,
      instruments,
      prices: prices.map(p => ({ ...p, timestamp: p.timestamp.toISOString() })),
      activities: activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
    }

    return NextResponse.json(exportData)
  } catch (error) {
    console.error("[ExportDB] Error:", error)
    return NextResponse.json(
      { error: "Failed to export database" },
      { status: 500 }
    )
  }
}
