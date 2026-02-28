import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { paymentQrCodeSchema } from "@/lib/validations/payment"

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

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = paymentQrCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const qrCode = await prisma.paymentQrCode.create({ data: parsed.data })
    return NextResponse.json(qrCode)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "创建二维码失败" }, { status: 500 })
  }
}
