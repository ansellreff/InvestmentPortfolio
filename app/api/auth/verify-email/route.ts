import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authRateLimit } from "@/lib/utils/rateLimit"
import { logger } from "@/lib/utils/logger"
import crypto from "crypto"

/**
 * POST /api/auth/verify-email
 * Send a new verification email to the user
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

    if (!user) {
      // Don't reveal whether user exists for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent."
      })
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        email: user.email,
        token,
        expires,
      },
    })

    // Send verification email
    const { sendVerificationEmail } = await import('@/lib/email')
    const emailSent = await sendVerificationEmail(user.email, token)

    if (!emailSent) {
      logger.error(`Failed to send verification email to ${user.email}`)
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      )
    }

    logger.info(`Verification email sent to ${user.email}`)

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    })
  } catch (error) {
    logger.error('[Email Verification] Error sending verification email:', error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/verify-email?token=xxx
 * Verify email using token
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

    // Find verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    })

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { token },
      })
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Verify the user's email
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: new Date() },
    })

    // Delete the verification token
    await prisma.emailVerificationToken.delete({
      where: { token },
    })

    logger.info(`Email verified for user ${verificationToken.userId}`)

    return NextResponse.json({
      success: true,
      message: "Email verified successfully"
    })
  } catch (error) {
    logger.error('[Email Verification] Error verifying email:', error)
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}
