import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { notifyAdmins } from "@/lib/notifications"

type Props = { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Props) {
  try {
    const user = await requireUser()
    const { id } = await params
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id, userId: user.id } })
      if (!order) throw new Error("NOT_FOUND")
      if (order.status !== "QUOTED") throw new Error("INVALID_STATUS")
      const updated = await tx.order.updateMany({
        where: { id, userId: user.id, status: "QUOTED", updatedAt: order.updatedAt },
        data: { status: "ACCEPTED", acceptedAt: new Date() }
      })
      if (updated.count !== 1) throw new Error("ORDER_CONFLICT")
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ORDER_QUOTE_ACCEPTED",
          entityType: "Order",
          entityId: id,
          before: { status: "QUOTED" },
          after: { status: "ACCEPTED" }
        }
      })
      return order
    })

    notifyAdmins({
      type: "ORDER_STATUS",
      title: "用户已接受报价",
      message: `订单 #${id.slice(0, 8)} 已接受报价，可以安排执行。`,
      orderId: id,
      sendEmail: true
    }).catch(() => undefined)
    return NextResponse.json({ success: true, amount: result.amount ? Number(result.amount) : null })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      if (error.message === "NOT_FOUND") return NextResponse.json({ error: "订单不存在" }, { status: 404 })
      if (["INVALID_STATUS", "ORDER_CONFLICT"].includes(error.message)) {
        return NextResponse.json({ error: "该报价当前不能接受" }, { status: 409 })
      }
    }
    return NextResponse.json({ error: "接受报价失败" }, { status: 500 })
  }
}
