import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

export async function PUT() {
  try {
    const user = await requireUser()

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true }
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
