import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { tagSchema } from "@/lib/validations/tag"

type Props = { params: { id: string } }

export async function PUT(req: Request, { params }: Props) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = tagSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: parsed.data
    })
    return NextResponse.json(tag)
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "更新标签失败" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Props) {
  try {
    await requireAdmin()
    await prisma.tag.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "删除标签失败" }, { status: 500 })
  }
}
