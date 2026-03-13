import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { authRateLimit } from "@/lib/utils/rateLimit"
import { logger } from "@/lib/utils/logger"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!authRateLimit.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { token },
      })
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset link has already been used. Please request a new one." },
        { status: 400 }
      )
    }

    // Validate password strength
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return NextResponse.json(
        { error: "Password must contain uppercase, lowercase, and number" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { token },
      data: { used: true },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: resetToken.userId,
        action: "PASSWORD_RESET",
        description: "Password was reset using email link",
      },
    })

    logger.info(`Password reset successful for user ${resetToken.userId}`)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password."
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }

    logger.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Verify reset token is valid
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: "Invalid reset token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expires < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Reset token has expired" },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (resetToken.used) {
      return NextResponse.json(
        { valid: false, error: "This reset link has already been used" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      valid: true,
      message: "Token is valid"
    })
  } catch (error) {
    logger.error('[Reset Password] Error verifying token:', error)
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    )
  }
}
