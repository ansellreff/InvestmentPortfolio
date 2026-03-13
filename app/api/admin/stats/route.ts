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
    const [totalUsers, totalPortfolios, totalFavorites, totalActivities] = await Promise.all([
      prisma.user.count(),
      prisma.portfolio.count(),
      prisma.favorite.count(),
      prisma.activityLog.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPortfolios,
        totalFavorites,
        totalActivities,
      },
    })
  } catch (error) {
    console.error("[AdminStats] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
