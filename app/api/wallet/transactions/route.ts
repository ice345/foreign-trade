import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get("page") ?? 1)
    const pageSize = Number(searchParams.get("pageSize") ?? 20)

    const [data, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          order: { select: { id: true, resource: { select: { title: true } } } }
        }
      }),
      prisma.transaction.count({ where: { userId: user.id } })
    ])

    return NextResponse.json({ data, total, page, pageSize })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
