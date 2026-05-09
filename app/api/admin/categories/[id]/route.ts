import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { categorySchema } from "@/lib/validations/category"

type Props = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Props) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = categorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data
    })
    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Props) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 })
  }
}
