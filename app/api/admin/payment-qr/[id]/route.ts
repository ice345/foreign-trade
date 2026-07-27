import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth"

export async function PUT() {
  try {
    await requireAdmin()
    return NextResponse.json({ error: "收款二维码配置已冻结" }, { status: 410 })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "更新二维码失败" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await requireAdmin()
    return NextResponse.json({ error: "收款二维码配置已冻结" }, { status: 410 })
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "删除二维码失败" }, { status: 500 })
  }
}
