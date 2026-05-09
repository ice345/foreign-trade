import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { approvePaymentSchema } from "@/lib/validations/payment"
import { createNotification } from "@/lib/notifications"

type Props = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Props) {
  try {
    const admin = await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const parsed = approvePaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { status } = parsed.data
    const reviewNote = parsed.data.reviewNote ?? parsed.data.note

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.paymentRequest.findUnique({
        where: { id }
      })

      if (!request) {
        throw new Error("NOT_FOUND")
      }

      if (request.status !== "PENDING") {
        throw new Error("ALREADY_PROCESSED")
      }

      if (status === "APPROVED" && !request.screenshotUrl) {
        throw new Error("MISSING_SCREENSHOT")
      }

      const updateResult = await tx.paymentRequest.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedById: admin.id,
          ...(reviewNote !== undefined && { reviewNote })
        }
      })

      if (updateResult.count === 0) {
        throw new Error("ALREADY_PROCESSED")
      }

      if (status === "APPROVED") {
        const amount = Number(request.amount)
        const existingWallet = await tx.wallet.findUnique({
          where: { userId: request.userId }
        })
        const beforeBalance = existingWallet ? Number(existingWallet.balance) : 0
        const afterBalance = beforeBalance + amount

        const wallet = existingWallet
          ? await tx.wallet.update({
              where: { userId: request.userId },
              data: { balance: { increment: amount } }
            })
          : await tx.wallet.create({
              data: { userId: request.userId, balance: amount }
            })

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: request.userId,
            type: "TOPUP",
            amount,
            beforeBalance,
            afterBalance,
            description: `扫码充值审核通过 ¥${amount.toFixed(2)}`,
            paymentRequestId: request.id,
            referenceNo: request.referenceNo ?? undefined,
            adminId: admin.id
          }
        })
      }

      return tx.paymentRequest.findUniqueOrThrow({ where: { id } })
    })

    const amount = Number(result.amount)

    if (status === "APPROVED") {
      createNotification({
        userId: result.userId,
        type: "BALANCE_TOPUP",
        title: "充值成功",
        message: `您的充值请求 ¥${amount.toFixed(2)} 已通过审核，余额已更新。`,
        sendEmail: true
      }).catch((err) => console.error("[Payment Approved Notification Error]", err))
    } else {
      createNotification({
        userId: result.userId,
        type: "SYSTEM",
        title: "充值请求被拒绝",
        message: `您的充值请求 ¥${amount.toFixed(2)} 已被拒绝。${reviewNote ? `原因：${reviewNote}` : ""}`,
        sendEmail: true
      }).catch((err) => console.error("[Payment Rejected Notification Error]", err))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized" || error.message === "Forbidden") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (error.message === "NOT_FOUND") {
        return NextResponse.json({ error: "充值请求不存在" }, { status: 404 })
      }
      if (error.message === "ALREADY_PROCESSED") {
        return NextResponse.json({ error: "该请求已处理" }, { status: 400 })
      }
      if (error.message === "MISSING_SCREENSHOT") {
        return NextResponse.json({ error: "缺少支付截图，不能通过审核" }, { status: 400 })
      }
    }
    return NextResponse.json({ error: "处理充值请求失败" }, { status: 500 })
  }
}
