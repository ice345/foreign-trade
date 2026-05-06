import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { approvePaymentSchema } from "@/lib/validations/payment"
import { createNotification } from "@/lib/notifications"

type Props = { params: { id: string } }

export async function PUT(req: Request, { params }: Props) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = approvePaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { status, note } = parsed.data

    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.paymentRequest.findUnique({
        where: { id: params.id }
      })

      if (!request) {
        throw new Error("NOT_FOUND")
      }

      if (request.status !== "PENDING") {
        throw new Error("ALREADY_PROCESSED")
      }

      const updated = await tx.paymentRequest.update({
        where: { id: params.id },
        data: {
          status,
          ...(note !== undefined && { note })
        }
      })

      if (status === "APPROVED") {
        const amount = Number(request.amount)

        const wallet = await tx.wallet.upsert({
          where: { userId: request.userId },
          update: { balance: { increment: amount } },
          create: { userId: request.userId, balance: amount }
        })

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: request.userId,
            type: "TOPUP",
            amount,
            description: `在线充值 ¥${amount.toFixed(2)}`
          }
        })
      }

      return updated
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
        message: `您的充值请求 ¥${amount.toFixed(2)} 已被拒绝。${note ? `原因：${note}` : ""}`,
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
    }
    return NextResponse.json({ error: "处理充值请求失败" }, { status: 500 })
  }
}
