import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth"
import { registerSchema } from "@/lib/validations/auth"
import { verifyCode } from "@/lib/verification"
import { rateLimitByIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const limit = await rateLimitByIp(request, "register", 5, 60 * 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "注册请求过于频繁，请稍后再试" },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      )
    }

    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { type, target, code, password } = parsed.data
    const normalizedTarget =
      type === "EMAIL" ? target.trim().toLowerCase() : target.trim()

    const codeValid = await verifyCode(normalizedTarget, code, type)
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

    const hashed = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email: type === "EMAIL" ? normalizedTarget : null,
        phone: type === "PHONE" ? normalizedTarget : null,
        password: hashed,
        role: "USER"
      },
      select: {
        id: true,
        email: true,
        phone: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { id: user.id, email: user.email, phone: user.phone }
    })
  } catch (error) {
    console.error("[Register Error]", error);
    const message = error instanceof Error ? error.message : ""
    if (message.includes("does not exist") || message.includes("Unknown argument")) {
      return NextResponse.json(
        { success: false, error: "数据库结构未更新，请先在 Vercel/Neon 执行 Prisma 迁移" },
        { status: 503 }
      )
    }
    return NextResponse.json(
      { success: false, error: "注册失败" },
      { status: 500 }
    )
  }
}
