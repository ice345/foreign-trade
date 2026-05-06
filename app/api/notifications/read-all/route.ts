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
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Notifications Read All Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
