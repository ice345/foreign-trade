import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { getOrCreateWallet } from "@/lib/wallet"

export async function GET() {
  try {
    const user = await requireUser()
    const wallet = await getOrCreateWallet(user.id)
    return NextResponse.json({ id: wallet.id, balance: Number(wallet.balance) })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Wallet GET Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}
