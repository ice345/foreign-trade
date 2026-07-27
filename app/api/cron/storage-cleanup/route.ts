import { NextResponse } from "next/server"
import { cleanupStorage } from "@/lib/storage-cleanup"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse(null, { status: 404 })
  }
  try {
    return NextResponse.json(await cleanupStorage())
  } catch (error) {
    console.error("[Storage Cleanup Error]", error)
    return NextResponse.json({ error: "Storage cleanup failed" }, { status: 500 })
  }
}
