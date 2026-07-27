import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { tagSchema } from "@/lib/validations/tag"

type Props = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Props) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = tagSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const tag = await prisma.$transaction(async (tx) => {
      const current = await tx.tag.findUniqueOrThrow({ where: { id } })
      const updated = await tx.tag.update({ where: { id }, data: parsed.data })
      await tx.auditLog.create({ data: { actorId: admin.id, action: "TAG_UPDATED", entityType: "Tag", entityId: id, before: { name: current.name, sort: current.sort }, after: { name: updated.name, sort: updated.sort } } })
      return updated
    })
    return NextResponse.json(tag)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "更新标签失败" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    await prisma.$transaction(async (tx) => {
      const current = await tx.tag.delete({ where: { id } })
      await tx.auditLog.create({ data: { actorId: admin.id, action: "TAG_DELETED", entityType: "Tag", entityId: id, before: { name: current.name, sort: current.sort } } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "删除标签失败" }, { status: 500 })
  }
}
