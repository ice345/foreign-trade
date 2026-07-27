import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function POST() {
  try {
    await requireAdmin()
    return NextResponse.json(
      { error: "人工钱包充值已关闭，历史余额仅供审计与清退" },
      { status: 410 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
}
