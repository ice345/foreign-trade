import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

const DAY = 24 * 60 * 60 * 1000

function fillDailySeries<T extends { date: string }>(rows: T[], key: keyof Omit<T, "date">, now: Date) {
  const values = new Map(rows.map((row) => [row.date, Number(row[key])]))
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now.getTime() - (29 - index) * DAY).toISOString().slice(0, 10)
    return { date, [key]: values.get(date) ?? 0 }
  })
}

export async function GET() {
  try {
    await requireAdmin()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [
      totalOrders,
      totalRevenue,
      pendingOrders,
      activeResources,
      totalUsers,
      dailyOrders,
      dailyQuoteValue,
      topResources,
      topUsers,
      statusGroups,
      quotedOrders,
      acceptedOrders,
      recentOrders
    ] = await Promise.all([
      prisma.order.count({ where: { status: { notIn: ["CANCELLED", "REFUNDED"] } } }),
      prisma.order.aggregate({
        where: { status: { in: ["ACCEPTED", "RUNNING", "POSTED", "CONFIRMED"] } },
        _sum: { amount: true }
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.resource.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE("createdAt")::text as date, COUNT(*)::int as count
        FROM "Order"
        WHERE "createdAt" >= ${thirtyDaysAgo}
          AND "status" NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,
      prisma.$queryRaw<{ date: string; quoteValue: number }[]>`
        SELECT DATE("createdAt")::text as date, COALESCE(SUM("amount"), 0)::float as "quoteValue"
        FROM "Order"
        WHERE "createdAt" >= ${thirtyDaysAgo}
          AND "status" IN ('ACCEPTED', 'RUNNING', 'POSTED', 'CONFIRMED')
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,
      prisma.$queryRaw<{ id: string; title: string; count: number }[]>`
        SELECT r."id", r."title", COUNT(o."id")::int as count
        FROM "Resource" r
        JOIN "Order" o ON o."resourceId" = r."id"
        WHERE o."status" NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY r."id", r."title"
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ id: string; email: string | null; phone: string | null; total: number }[]>`
        SELECT u."id", u."email", u."phone", COALESCE(SUM(o."amount"), 0)::float as total
        FROM "User" u
        JOIN "Order" o ON o."userId" = u."id"
        WHERE o."status" IN ('ACCEPTED', 'RUNNING', 'POSTED', 'CONFIRMED')
        GROUP BY u."id", u."email", u."phone"
        ORDER BY total DESC
        LIMIT 10
      `,
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.count({ where: { status: { in: ["QUOTED", "ACCEPTED", "RUNNING", "POSTED", "CONFIRMED"] } } }),
      prisma.order.count({ where: { status: { in: ["ACCEPTED", "RUNNING", "POSTED", "CONFIRMED"] } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          status: true,
          amount: true,
          createdAt: true,
          resourceTitle: true,
          resource: { select: { title: true } },
          user: { select: { nickname: true, email: true, phone: true } }
        }
      })
    ])

    return NextResponse.json({
      summary: {
        totalOrders,
        acceptedQuoteValue: Number(totalRevenue._sum.amount ?? 0),
        pendingOrders,
        activeResources,
        totalUsers,
        quotedOrders,
        acceptedOrders,
        quoteAcceptanceRate: quotedOrders ? acceptedOrders / quotedOrders : 0
      },
      trends: {
        dailyOrders: fillDailySeries(dailyOrders, "count", now),
        dailyQuoteValue: fillDailySeries(dailyQuoteValue, "quoteValue", now)
      },
      pipeline: statusGroups.map((item) => ({ status: item.status, count: item._count._all })),
      rankings: {
        topResources,
        topUsers
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        status: order.status,
        amount: order.amount == null ? null : Number(order.amount),
        createdAt: order.createdAt.toISOString(),
        resourceTitle: order.resource?.title ?? order.resourceTitle ?? "已归档资源",
        user: order.user.nickname ?? order.user.email ?? order.user.phone ?? "匿名用户"
      }))
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Admin Stats Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
