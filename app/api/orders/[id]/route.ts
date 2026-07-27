import { NextResponse } from "next/server"
import { OrderStatus, Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { createNotification } from "@/lib/notifications"
import { updateOrderSchema } from "@/lib/validations/order"
import { isInternalFileUrl } from "@/lib/security"
import { fileIdFromUrl, validateFileReference } from "@/lib/storage"
import { canAdminTransition, isTerminalOrder } from "@/lib/order-state"

type Props = { params: Promise<{ id: string }> }

const labels: Record<string, string> = {
  PENDING: "待评估",
  QUOTED: "已报价",
  ACCEPTED: "已接受",
  RUNNING: "执行中",
  POSTED: "已发布",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  REFUNDED: "已退款"
}

export async function PUT(req: Request, { params }: Props) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const parsed = updateOrderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }
    const data = parsed.data

    if (data.screenshotUrl && !isInternalFileUrl(data.screenshotUrl)) {
      return NextResponse.json({ error: "订单截图必须通过本站上传" }, { status: 400 })
    }
    if (data.screenshotUrl) {
      const valid = await validateFileReference({
        url: data.screenshotUrl,
        purposes: ["ORDER_SCREENSHOT"]
      })
      if (!valid) return NextResponse.json({ error: "订单截图不可用" }, { status: 400 })
    }

    const screenshotFileId = data.screenshotUrl ? fileIdFromUrl(data.screenshotUrl) : null
    const result = await prisma.$transaction(async (tx) => {
      const oldOrder = await tx.order.findUnique({ where: { id } })
      if (!oldOrder) throw new Error("NOT_FOUND")
      if (isTerminalOrder(oldOrder.status)) {
        throw new Error("TERMINAL_ORDER")
      }
      if (data.status) {
        if (!canAdminTransition(oldOrder.status, data.status as OrderStatus)) {
          throw new Error("INVALID_TRANSITION")
        }
      }

      const claimed = await tx.order.updateMany({
        where: { id, status: oldOrder.status },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.status === "QUOTED" && {
            amount: data.amount,
            quoteNote: data.quoteNote ?? null,
            quotedAt: new Date()
          }),
          ...(data.postLink !== undefined && { postLink: data.postLink || null }),
          ...(data.screenshotUrl !== undefined && {
            screenshotUrl: data.screenshotUrl || null,
            screenshotFileId
          })
        }
      })
      if (claimed.count !== 1) throw new Error("ORDER_CONFLICT")

      if (screenshotFileId) {
        const attached = await tx.storedObject.updateMany({
          where: { id: screenshotFileId, purpose: "ORDER_SCREENSHOT", status: "READY" },
          data: { ownerId: oldOrder.userId }
        })
        if (attached.count !== 1) throw new Error("INVALID_SCREENSHOT")
      }

      const updated = await tx.order.findUniqueOrThrow({
        where: { id },
        include: { resource: { select: { title: true } } }
      })
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: data.status === "QUOTED" ? "ORDER_QUOTED" : "ORDER_UPDATED",
          entityType: "Order",
          entityId: id,
          before: { status: oldOrder.status, amount: oldOrder.amount ? Number(oldOrder.amount) : null },
          after: { status: updated.status, amount: updated.amount ? Number(updated.amount) : null }
        }
      })
      return { oldOrder, order: updated }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    const { oldOrder, order } = result

    if (data.status && oldOrder.status !== data.status) {
      createNotification({
        userId: order.userId,
        type: "ORDER_STATUS",
        title: data.status === "QUOTED" ? "推广方案已报价" : "推广进度已更新",
        message: data.status === "QUOTED"
          ? `「${order.resource?.title ?? order.resourceTitle ?? "推广需求"}」已完成报价，请登录确认。`
          : `订单状态已更新为：${labels[data.status]}`,
        orderId: order.id,
        sendEmail: true
      }).catch(() => undefined)
    }

    return NextResponse.json({
      ...order,
      amount: order.amount ? Number(order.amount) : null,
      resourcePrice: order.resourcePrice ? Number(order.resourcePrice) : null,
      finalPrice: order.finalPrice ? Number(order.finalPrice) : null
    })
  } catch (error) {
    const known: Record<string, [string, number]> = {
      NOT_FOUND: ["订单不存在", 404],
      TERMINAL_ORDER: ["终态订单不能修改", 400],
      INVALID_TRANSITION: ["不允许的订单状态变更", 400],
      ORDER_CONFLICT: ["订单状态已变化，请刷新后重试", 409],
      INVALID_SCREENSHOT: ["订单截图不可用", 400]
    }
    if (error instanceof Error && known[error.message]) {
      const [message, status] = known[error.message]
      return NextResponse.json({ error: message }, { status })
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("[Order Update Error]", error)
    return NextResponse.json({ error: "更新订单失败" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: Props) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    let reason = "管理员取消订单"
    try {
      const body = await req.json()
      if (typeof body.reason === "string" && body.reason.trim()) {
        reason = body.reason.trim().slice(0, 500)
      }
    } catch {
      // A reason is optional for compatibility with existing admin clients.
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { resource: { select: { title: true } }, transactions: true }
      })
      if (!order) throw new Error("NOT_FOUND")
      if (isTerminalOrder(order.status)) {
        throw new Error("TERMINAL_ORDER")
      }

      const claimed = await tx.order.updateMany({
        where: { id, status: order.status },
        data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason, cancelledById: admin.id }
      })
      if (claimed.count !== 1) throw new Error("ORDER_CONFLICT")

      const deduction = order.transactions.find((item) => item.type === "DEDUCTION")
      const existingRefund = order.transactions.find((item) => item.type === "REFUND")
      let refundedAmount = 0

      if (deduction && !existingRefund) {
        const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } })
        if (!wallet) throw new Error("WALLET_NOT_FOUND")
        refundedAmount = Math.abs(Number(deduction.amount))
        const beforeBalance = Number(wallet.balance)
        const updatedWallet = await tx.wallet.update({
          where: { userId: order.userId },
          data: { balance: { increment: refundedAmount } }
        })
        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: order.userId,
            type: "REFUND",
            amount: refundedAmount,
            beforeBalance,
            afterBalance: Number(updatedWallet.balance),
            description: `历史订单取消退款 #${order.id.slice(0, 8)}`,
            orderId: order.id,
            adminId: admin.id
          }
        })
        await tx.order.update({ where: { id }, data: { status: "REFUNDED" } })
      }

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: refundedAmount > 0 ? "ORDER_CANCELLED_AND_REFUNDED" : "ORDER_CANCELLED",
          entityType: "Order",
          entityId: id,
          before: { status: order.status },
          after: { status: refundedAmount > 0 ? "REFUNDED" : "CANCELLED", refundedAmount },
          reason
        }
      })
      return { order, refundedAmount }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    createNotification({
      userId: result.order.userId,
      type: "SYSTEM",
      title: result.refundedAmount > 0 ? "订单已取消并退回历史余额" : "推广需求已取消",
      message: `「${result.order.resource?.title ?? result.order.resourceTitle ?? "推广需求"}」已取消。${result.refundedAmount > 0 ? `已退回 ¥${result.refundedAmount.toFixed(2)}。` : ""}原因：${reason}`,
      orderId: result.order.id,
      sendEmail: true
    }).catch(() => undefined)

    return NextResponse.json({ success: true })
  } catch (error) {
    const known: Record<string, [string, number]> = {
      NOT_FOUND: ["订单不存在", 404],
      TERMINAL_ORDER: ["终态订单不能取消", 400],
      ORDER_CONFLICT: ["订单状态已变化，请刷新后重试", 409],
      WALLET_NOT_FOUND: ["历史钱包不存在，无法自动退款", 400],
      Unauthorized: ["Unauthorized", 401],
      Forbidden: ["Forbidden", 403]
    }
    if (error instanceof Error && known[error.message]) {
      const [message, status] = known[error.message]
      return NextResponse.json({ error: message }, { status })
    }
    console.error("[Order Cancel Error]", error)
    return NextResponse.json({ error: "取消订单失败" }, { status: 500 })
  }
}
