import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { parsePagination } from "@/lib/pagination"

export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip, take } = parsePagination(searchParams)
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const where = {
      userId: user.id,
      ...(unreadOnly ? { read: false } : {})
    }

    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: user.id, read: false } })
    ])

    return NextResponse.json({ data, total, unreadCount, page, pageSize })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
