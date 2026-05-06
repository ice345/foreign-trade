import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { parsePagination } from "@/lib/pagination"

export async function GET(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip, take } = parsePagination(searchParams)
    const status = searchParams.get("status")

    const where: { status?: "PENDING" | "APPROVED" | "REJECTED" } = {}
    if (status === "PENDING" || status === "APPROVED" || status === "REJECTED") {
      where.status = status
    }

    const [data, total] = await Promise.all([
      prisma.paymentRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          user: { select: { id: true, email: true, phone: true, nickname: true } }
        }
      }),
      prisma.paymentRequest.count({ where })
    ])

    return NextResponse.json({
      data: data.map((r) => ({ ...r, amount: Number(r.amount) })),
      total,
      page,
      pageSize
    })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "获取充值请求失败" }, { status: 500 })
  }
}
