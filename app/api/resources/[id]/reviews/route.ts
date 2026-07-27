import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { createReviewSchema } from "@/lib/validations/review"
import { parsePagination } from "@/lib/pagination"

type Props = { params: Promise<{ id: string }> }

function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return "***"
  const masked = local.length > 1 ? local[0] + "***" : "***"
  return `${masked}@${domain}`
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return "****"
  return phone.slice(0, 3) + "****" + phone.slice(-4)
}

export async function GET(req: Request, { params }: Props) {
  const { id } = await params
  const resource = await prisma.resource.findFirst({ where: { id, status: { not: "HIDDEN" } }, select: { id: true } })
  if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const { searchParams } = new URL(req.url)
  const { page, pageSize, skip, take } = parsePagination(searchParams, { pageSize: 10 })

  const [reviews, total, avgResult] = await Promise.all([
    prisma.review.findMany({
      where: { resourceId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        user: { select: { email: true, phone: true, nickname: true } }
      }
    }),
    prisma.review.count({ where: { resourceId: id } }),
    prisma.review.aggregate({
      where: { resourceId: id },
      _avg: { rating: true }
    })
  ])

  return NextResponse.json({
    data: reviews.map((r) => ({
      ...r,
      user: {
        nickname: r.user.nickname ?? null,
        email: r.user.email ? maskEmail(r.user.email) : null,
        phone: r.user.phone ? maskPhone(r.user.phone) : null
      }
    })),
    total,
    page,
    pageSize,
    averageRating: avgResult._avg.rating ?? null
  })
}

export async function POST(req: Request, { params }: Props) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()
    const parsed = createReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { orderId, rating, comment } = parsed.data

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, resourceId: true, status: true }
    })

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 })
    }

    if (order.userId !== user.id) {
      return NextResponse.json({ error: "无权评价" }, { status: 403 })
    }

    if (order.resourceId !== id) {
      return NextResponse.json({ error: "订单与资源不匹配" }, { status: 400 })
    }

    if (order.status !== "CONFIRMED") {
      return NextResponse.json({ error: "只有已确认的订单可以评价" }, { status: 400 })
    }

    const existing = await prisma.review.findUnique({
      where: { orderId }
    })

    if (existing) {
      return NextResponse.json({ error: "该订单已评价" }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        resourceId: id,
        orderId,
        rating,
        comment: comment ?? null
      }
    })

    return NextResponse.json(review)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: "评价失败" }, { status: 500 })
  }
}
