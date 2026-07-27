import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  try {
    await requireAdmin()
    const qrCodes = await prisma.paymentQrCode.findMany({
      orderBy: { createdAt: "desc" }
    })
    return NextResponse.json(qrCodes)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "获取二维码失败" }, { status: 500 })
  }
}

export async function POST() {
  try {
    await requireAdmin()
    return NextResponse.json({ error: "收款二维码配置已冻结" }, { status: 410 })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "创建二维码失败" }, { status: 500 })
  }
}
