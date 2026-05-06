import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleApiError } from "@/lib/api-response"
import { PaymentMethod } from "@prisma/client"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")

    const where: { active: true; type?: PaymentMethod } = { active: true }
    if (type === "WECHAT" || type === "ALIPAY") {
      where.type = type as PaymentMethod
    }

    const qrCodes = await prisma.paymentQrCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, imageUrl: true, label: true }
    })
    return NextResponse.json(qrCodes)
  } catch (error) {
    return handleApiError(error)
  }
}
