import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authRateLimit } from "@/lib/utils/rateLimit"
import { logger } from "@/lib/utils/logger"
import crypto from "crypto"

/**
 * POST /api/auth/forgot-password
 * Request a password reset email
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!authRateLimit.check(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`)
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent."
      })
    }

    // Delete any existing password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new password reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    })

    // Send password reset email
    try {
      const { sendPasswordResetEmail } = await import('@/lib/email')
      const emailSent = await sendPasswordResetEmail(user.email, token)

      if (!emailSent) {
        logger.error(`Failed to send password reset email to ${user.email}`)
        // Still return success for security
      } else {
        logger.info(`Password reset email sent to ${user.email}`)
      }
    } catch (emailError) {
      logger.error('Error sending password reset email:', emailError)
      // Still return success for security
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent."
    })
  } catch (error) {
    logger.error('[Forgot Password] Error:', error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
