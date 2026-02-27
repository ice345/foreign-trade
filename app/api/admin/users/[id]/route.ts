import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { deleteUserSchema } from "@/lib/validations/admin"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()

    const body = await request.json()
    const parsed = deleteUserSchema.safeParse({
      userId: params.id,
      reason: body.reason
    })

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { userId, reason } = parsed.data

    if (userId === admin.id) {
      return NextResponse.json(
        { success: false, error: "不能删除自己" },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "用户不存在" },
        { status: 404 }
      )
    }

    if (targetUser.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "不能删除管理员" },
        { status: 400 }
      )
    }

    if (targetUser.email) {
      await sendEmail({
        to: targetUser.email,
        subject: "GlobalPush 账号已被删除",
        html: `<p>您的 GlobalPush 账号已被管理员删除。</p><p><strong>原因：</strong>${reason}</p><p>如有疑问，请联系客服。</p>`
      })
    }

    if (targetUser.phone) {
      await sendSMS(
        targetUser.phone,
        `您的 GlobalPush 账号已被管理员删除。原因：${reason}。如有疑问请联系客服。`
      )
    }

    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "删除失败"
    const status = message === "Unauthorized" || message === "Forbidden" ? 401 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
