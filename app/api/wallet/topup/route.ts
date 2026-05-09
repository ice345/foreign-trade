import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"
import { topUpBalance } from "@/lib/wallet"
import { topUpSchema } from "@/lib/validations/wallet"
import { createNotification } from "@/lib/notifications"

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const body = await req.json()
    const parsed = topUpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { userId, amount, description } = parsed.data
    const wallet = await topUpBalance(userId, amount, description, { adminId: admin.id })

    await createNotification({
      userId,
      type: "BALANCE_TOPUP",
      title: "余额充值成功",
      message: `管理员为您充值 ¥${amount.toFixed(2)}，当前余额 ¥${Number(wallet.balance).toFixed(2)}`,
      sendEmail: true
    })

    return NextResponse.json({
      success: true,
      balance: Number(wallet.balance)
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }
    return NextResponse.json({ error: "充值失败" }, { status: 500 })
  }
}
