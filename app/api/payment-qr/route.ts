import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")

  const where: any = { active: true }
  if (type === "WECHAT" || type === "ALIPAY") {
    where.type = type
  }

  const qrCodes = await prisma.paymentQrCode.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, imageUrl: true, label: true }
  })
  return NextResponse.json(qrCodes)
}
