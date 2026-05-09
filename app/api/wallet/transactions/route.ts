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
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          order: { select: { id: true, resource: { select: { title: true } } } }
        }
      }),
      prisma.transaction.count({ where: { userId: user.id } })
    ])

    return NextResponse.json({
      data: data.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        beforeBalance: tx.beforeBalance == null ? null : Number(tx.beforeBalance),
        afterBalance: tx.afterBalance == null ? null : Number(tx.afterBalance)
      })),
      total,
      page,
      pageSize
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Wallet Transactions Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
