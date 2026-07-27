import { NextResponse } from "next/server"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { sendVerificationCode } from "@/lib/verification"
import { rateLimitByIp } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const limit = await rateLimitByIp(request, "forgot-password", 1, 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "请等待 60 秒后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { target, type } = parsed.data
    const normalizedTarget =
      type === "EMAIL" ? target.trim().toLowerCase() : target.trim()

    const user = await prisma.user.findFirst({
      where: type === "EMAIL" ? { email: normalizedTarget } : { phone: normalizedTarget },
      select: { id: true, status: true }
    })

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json({ success: true })
    }

    const result = await sendVerificationCode(normalizedTarget, type)

    if (!result.success) {
      const isRateLimited = result.error?.includes("等待")
      if (isRateLimited) {
        return NextResponse.json(
          { success: false, error: "请等待 60 秒后再试" },
          { status: 429 }
        )
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({
      success: true,
      ...(result.code ? { code: result.code } : {})
    })
  } catch (error) {
    console.error("[Forgot Password Error]", error);
    return NextResponse.json(
      { success: false, error: "发送验证码失败" },
      { status: 500 }
    )
  }
}
