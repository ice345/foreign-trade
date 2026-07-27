import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { deleteUserSchema } from "@/lib/validations/admin"
import { sendEmail } from "@/lib/email"
import { sendSMS } from "@/lib/sms"
import { escapeHtml } from "@/lib/security"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const parsed = deleteUserSchema.safeParse({
      userId: id,
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

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          status: "DELETED",
          sessionVersion: { increment: 1 },
          deletedAt: new Date(),
          deletedReason: reason
        }
      })
      await tx.auditLog.create({ data: {
        actorId: admin.id,
        action: "USER_DISABLED",
        entityType: "User",
        entityId: userId,
        before: { status: targetUser.status, role: targetUser.role },
        after: { status: "DELETED", role: targetUser.role },
        reason
      } })
    })

    if (targetUser.email) {
      sendEmail({
        to: targetUser.email,
        subject: "GlobalPush 账号已被删除",
        html: `<p>您的 GlobalPush 账号已被管理员删除。</p><p><strong>原因：</strong>${escapeHtml(reason)}</p><p>如有疑问，请联系客服。</p>`
      }).catch((err) => console.error("[User Delete Email Error]", err))
    }

    if (targetUser.phone) {
      sendSMS(
        targetUser.phone,
        `您的 GlobalPush 账号已被管理员删除。原因：${reason}。如有疑问请联系客服。`
      ).catch((err) => console.error("[User Delete SMS Error]", err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
      }
    }
    return NextResponse.json({ success: false, error: "删除失败" }, { status: 500 })
  }
}
