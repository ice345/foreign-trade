import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function PUT() {
  try {
    await requireAdmin()
    return NextResponse.json(
      { error: "充值审核已关闭，历史申请仅供审计查看" },
      { status: 410 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
}
