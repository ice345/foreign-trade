import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { updateProfileSchema } from "@/lib/validations/profile"

export async function PUT(req: Request) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const parsed = updateProfileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const data = parsed.data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.nickname !== undefined && { nickname: data.nickname || null }),
        ...(data.avatar !== undefined && { avatar: data.avatar ?? null })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "更新资料失败" }, { status: 500 })
  }
}
