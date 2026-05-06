import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"

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
      dailyRevenue,
      topResources,
      topUsers
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { amount: true } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.resource.count({ where: { status: "ACTIVE" } }),
      prisma.user.count(),
      prisma.$queryRaw<{ date: string; count: number }[]>`
        SELECT DATE("createdAt")::text as date, COUNT(*)::int as count
        FROM "Order"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,
      prisma.$queryRaw<{ date: string; revenue: number }[]>`
        SELECT DATE("createdAt")::text as date, COALESCE(SUM("amount"), 0)::float as revenue
        FROM "Order"
        WHERE "createdAt" >= ${thirtyDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt") ASC
      `,
      prisma.$queryRaw<{ id: string; title: string; count: number }[]>`
        SELECT r."id", r."title", COUNT(o."id")::int as count
        FROM "Resource" r
        JOIN "Order" o ON o."resourceId" = r."id"
        GROUP BY r."id", r."title"
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw<{ id: string; email: string | null; phone: string | null; total: number }[]>`
        SELECT u."id", u."email", u."phone", COALESCE(SUM(o."amount"), 0)::float as total
        FROM "User" u
        JOIN "Order" o ON o."userId" = u."id"
        GROUP BY u."id", u."email", u."phone"
        ORDER BY total DESC
        LIMIT 10
      `
    ])

    return NextResponse.json({
      summary: {
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        pendingOrders,
        activeResources,
        totalUsers
      },
      trends: {
        dailyOrders,
        dailyRevenue
      },
      rankings: {
        topResources,
        topUsers
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Admin Stats Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
