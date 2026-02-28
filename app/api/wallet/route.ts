import { NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { getOrCreateWallet } from "@/lib/wallet"

export async function GET() {
  try {
    const user = await requireUser()
    const wallet = await getOrCreateWallet(user.id)
    return NextResponse.json({ id: wallet.id, balance: Number(wallet.balance) })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
