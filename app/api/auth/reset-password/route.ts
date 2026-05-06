import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { resetPasswordSchema } from "@/lib/validations/auth"
import { verifyCode } from "@/lib/verification"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const limit = rateLimitByIp(request, "reset-password", 5, 60 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const parsed = resetPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, target, code, password } = parsed.data
    const normalizedTarget =
      type === "EMAIL" ? target.trim().toLowerCase() : target.trim()

    const codeValid = await verifyCode(normalizedTarget, code)
    if (!codeValid) {
      return NextResponse.json(
        { success: false, error: "验证码无效或已过期" },
        { status: 400 }
      )
    }

    const whereClause =
      type === "EMAIL"
        ? { email: normalizedTarget }
        : { phone: normalizedTarget }

    const user = await prisma.user.findFirst({ where: whereClause })
    if (!user) {
      return NextResponse.json(
        { success: false, error: "账号不存在" },
        { status: 400 }
      )
    }

    const hashed = await hashPassword(password)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Reset Password Error]", error);
    return NextResponse.json(
      { success: false, error: "重置密码失败" },
      { status: 500 }
    )
  }
}
