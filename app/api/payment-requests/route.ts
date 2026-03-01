import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { paymentRequestSchema } from "@/lib/validations/payment"
import { parsePagination } from "@/lib/pagination"
import { rateLimitByIp } from "@/lib/rate-limit"
import { notifyAdmins } from "@/lib/notifications"

function generateReferenceNo(): string {
  const date = new Date()
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const rand = crypto.randomBytes(4).toString("hex").toUpperCase()
  return `GP${y}${m}${d}${rand}`
}

export async function GET(req: Request) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const { page, pageSize, skip, take } = parsePagination(searchParams)

    const [data, total] = await Promise.all([
      prisma.paymentRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip,
        take
      }),
      prisma.paymentRequest.count({ where: { userId: user.id } })
    ])

    return NextResponse.json({
      data: data.map((r) => ({
        ...r,
        amount: Number(r.amount),
        screenshotUrl: r.screenshotUrl ?? null,
        referenceNo: r.referenceNo ?? null
      })),
      total,
      page,
      pageSize
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: Request) {
  try {
    const limit = rateLimitByIp(req, "payment-request", 5, 60 * 1000)
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      )
    }

    const user = await requireUser()
    const body = await req.json()
    const parsed = paymentRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const referenceNo = generateReferenceNo()

    const request = await prisma.paymentRequest.create({
      data: {
        userId: user.id,
        amount: parsed.data.amount,
        paymentMethod: parsed.data.paymentMethod,
        qrCodeId: parsed.data.qrCodeId ?? null,
        note: parsed.data.note ?? null,
        screenshotUrl: parsed.data.screenshotUrl || null,
        referenceNo,
        status: "PENDING"
      }
    })

    const methodLabel = parsed.data.paymentMethod === "WECHAT" ? "微信支付" : "支付宝"
    notifyAdmins({
      type: "BALANCE_TOPUP",
      title: "新充值申请",
      message: `用户提交了 ¥${parsed.data.amount.toFixed(2)} 的充值申请（${methodLabel}），编号：${referenceNo}`,
      sendEmail: true
    }).catch(() => {})

    return NextResponse.json({ success: true, id: request.id, referenceNo })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "提交充值请求失败" }, { status: 500 })
  }
}
