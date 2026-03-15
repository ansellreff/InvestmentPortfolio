import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { logger } from "@/lib/utils/logger"

/**
 * POST /api/admin/users/[userId]/reset-password
 * Reset a user's password (admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()

  // Check if user is authenticated and is admin
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 403 }
    )
  }

  try {
    const { userId } = await params
    const body = await req.json()
    const { newPassword } = body

    // Validate new password
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_PASSWORD_RESET",
        description: `Reset password for user: ${user.email}`,
      }
    })

    logger.info(`[Admin] Password reset for user ${user.email} by ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: `Password has been reset for ${user.email}`
    })
  } catch (error) {
    logger.error("[Admin] Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
