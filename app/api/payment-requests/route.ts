import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { parsePagination } from "@/lib/pagination"

export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip, take } = parsePagination(searchParams)
    const [data, total] = await Promise.all([
      prisma.paymentRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.paymentRequest.count({ where: { userId: user.id } })
    ])
    return NextResponse.json({
      data: data.map((item) => ({ ...item, amount: Number(item.amount) })),
      total,
      page,
      pageSize
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "读取历史充值记录失败" }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "平台已切换为询价模式，不再接受余额充值" },
    { status: 410 }
  )
}
