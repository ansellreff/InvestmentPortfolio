import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET user details (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!adminUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  try {
    const { userId } = await params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        role: true,
        dateOfBirth: true,
        phone: true,
        location: true,
        timezone: true,
        bio: true,
        website: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            portfolios: true,
            favorites: true,
            activityLogs: true,
            binanceAssets: true,
            dividends: true,
            priceAlerts: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's portfolio
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Get user's favorites/watchlist
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        instrument: true,
      },
      orderBy: { createdAt: "desc" },
    })

    // Get recent activity logs
    const recentActivity = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    // Get user preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId },
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString(),
          dateOfBirth: user.dateOfBirth?.toISOString(),
        },
        portfolio,
        favorites,
        recentActivity: recentActivity.map(a => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
        preferences,
      },
    })
  } catch (error) {
    console.error("[AdminUserDetail] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    )
  }
}

// PUT - Update user (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!adminUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  try {
    const { userId } = await params
    const body = await req.json()

    // Prevent modifying your own admin status
    if (userId === session.user.id && body.isAdmin === false) {
      return NextResponse.json(
        { error: "Cannot remove your own admin status" },
        { status: 400 }
      )
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.timezone !== undefined && { timezone: body.timezone }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.isAdmin !== undefined && {
          isAdmin: body.isAdmin,
          role: body.isAdmin ? "admin" : "user",
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        role: true,
      },
    })

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId,
        action: "USER_UPDATED_BY_ADMIN",
        description: `User profile updated by admin ${session.user.email}`,
        metadata: JSON.stringify({ updatedBy: session.user.email }),
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error("[AdminUserDetail] Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE - Delete user's portfolio item (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!adminUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
  }

  try {
    const { userId } = await params
    const { searchParams } = new URL(req.url)
    const portfolioId = searchParams.get("portfolioId")

    if (!portfolioId) {
      return NextResponse.json({ error: "Portfolio ID is required" }, { status: 400 })
    }

    // Verify the portfolio belongs to the user
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
    })

    if (!portfolio || portfolio.userId !== userId) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    await prisma.portfolio.delete({
      where: { id: portfolioId },
    })

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId,
        action: "PORTFOLIO_DELETED_BY_ADMIN",
        description: `Portfolio item ${portfolio.symbol} deleted by admin ${session.user.email}`,
        metadata: JSON.stringify({
          symbol: portfolio.symbol,
          deletedBy: session.user.email,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[AdminUserDetail] Error deleting portfolio:", error)
    return NextResponse.json(
      { error: "Failed to delete portfolio item" },
      { status: 500 }
    )
  }
}
