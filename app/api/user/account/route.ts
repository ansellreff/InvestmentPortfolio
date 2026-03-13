import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const userId = session.user.id

    // Delete all related data in correct order due to foreign keys
    await prisma.activityLog.deleteMany({ where: { userId } })
    await prisma.portfolio.deleteMany({ where: { userId } })
    await prisma.favorite.deleteMany({ where: { userId } })
    await prisma.userPreference.deleteMany({ where: { userId } })
    await prisma.session.deleteMany({ where: { userId } })

    // Delete the user
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DeleteAccount] Error:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}
