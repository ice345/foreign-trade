import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await requireUser()
    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    return NextResponse.json({
      id: wallet?.id ?? null,
      balance: wallet ? Number(wallet.balance) : 0,
      legacy: Boolean(wallet)
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Wallet GET Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
