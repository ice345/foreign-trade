import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    { error: "平台已切换为询价模式，不再展示个人收款二维码" },
    { status: 410 }
  )
}
