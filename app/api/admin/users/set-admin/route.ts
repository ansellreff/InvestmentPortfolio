import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const setAdminSchema = z.object({
  userId: z.string(),
  isAdmin: z.boolean(),
})

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  })

  if (!adminUser?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId, isAdmin } = setAdminSchema.parse(body)

    // Prevent removing your own admin status
    if (userId === session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Cannot remove your own admin status" },
        { status: 400 }
      )
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isAdmin, role: isAdmin ? "admin" : "user" },
    })

    await prisma.activityLog.create({
      data: {
        userId,
        action: isAdmin ? "ADMIN_GRANTED" : "ADMIN_REVOKED",
        description: `Admin status ${isAdmin ? "granted" : "revoked"} by ${session.user.email}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      )
    }
    console.error("[SetAdmin] Error:", error)
    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    )
  }
}
