import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendCodeSchema } from "@/lib/validations/auth"
import { sendVerificationCode } from "@/lib/verification"
import { rateLimitByKey } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = sendCodeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { target, type } = parsed.data
    const normalizedTarget =
      type === "EMAIL" ? target.trim().toLowerCase() : target.trim()

    const limit = await rateLimitByKey(
      `send-code:target:${encodeURIComponent(normalizedTarget)}`,
      1,
      60 * 1000
    )
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "请等待 60 秒后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      )
    }

    const whereClause =
      type === "EMAIL"
        ? { email: normalizedTarget }
        : { phone: normalizedTarget }

    const existing = await prisma.user.findFirst({
      where: whereClause,
      select: { id: true }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该账号已注册" },
        { status: 400 }
      )
    }

    const result = await sendVerificationCode(normalizedTarget, type)

    if (!result.success) {
      const isRateLimited = result.error?.includes("等待")
      return NextResponse.json(
        { success: false, error: result.error },
        { status: isRateLimited ? 429 : 503 }
      )
    }

    return NextResponse.json({
      success: true,
      ...(result.code ? { code: result.code } : {})
    })
  } catch (error) {
    console.error("[Send Code Error]", error);
    return NextResponse.json(
      { success: false, error: "发送验证码失败" },
      { status: 500 }
    )
  }
}
