import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendCodeSchema } from "@/lib/validations/auth"
import { sendVerificationCode } from "@/lib/verification"

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

    const whereClause =
      type === "EMAIL"
        ? { email: normalizedTarget }
        : { phone: normalizedTarget }

    const existing = await prisma.user.findFirst({ where: whereClause })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "该账号已注册" },
        { status: 400 }
      )
    }

    const result = await sendVerificationCode(normalizedTarget, type)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 429 }
      )
    }

    return NextResponse.json({
      success: true,
      ...(result.code ? { code: result.code } : {})
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "发送验证码失败" },
      { status: 500 }
    )
  }
}
