import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

export async function PUT(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params

    const notification = await prisma.notification.findUnique({
      where: { id }
    })

    if (!notification || notification.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Notification Read Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
