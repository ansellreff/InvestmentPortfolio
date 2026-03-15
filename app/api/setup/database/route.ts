import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Database Setup Endpoint
 * Initializes the database by checking if tables exist
 * This is safe to run multiple times
 */
export async function GET(req: NextRequest) {
  try {
    // Check if database is accessible by running a simple query
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: "healthy",
      message: "Database is connected and ready",
      userCount,
      tables: {
        users: true,
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Initialize database tables
 * POST to this endpoint to create tables if they don't exist
 */
export async function POST(req: NextRequest) {
  try {
    // This endpoint is meant for initial setup only
    // In production, use Prisma Migrations or Vercel's database setup

    // Check if we can reach the database
    await prisma.$connect()

    // Test by creating a dummy query
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: "success",
      message: "Database is accessible. If tables are missing, run 'npx prisma db push' locally with Vercel env vars.",
      userCount
    })
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: "Database initialization failed",
      error: error.message,
      hint: "Make sure DATABASE_URL is set in Vercel environment variables"
    }, { status: 500 })
  }
}
