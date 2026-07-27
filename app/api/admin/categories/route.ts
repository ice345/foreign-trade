import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { categorySchema } from "@/lib/validations/category"

export async function GET() {
  try {
    await requireAdmin()
    const categories = await prisma.category.findMany({
      orderBy: { sort: "asc" },
      include: { _count: { select: { resources: true } } }
    })
    return NextResponse.json(categories)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const parsed = categorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const category = await prisma.$transaction(async (tx) => {
      const created = await tx.category.create({ data: parsed.data })
      await tx.auditLog.create({ data: { actorId: admin.id, action: "CATEGORY_CREATED", entityType: "Category", entityId: created.id, after: { name: created.name, sort: created.sort } } })
      return created
    })
    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "创建分类失败" }, { status: 500 })
  }
}
