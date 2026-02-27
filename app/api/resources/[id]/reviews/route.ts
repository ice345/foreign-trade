import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { createReviewSchema } from "@/lib/validations/review"

type Props = { params: { id: string } }

export async function GET(req: Request, { params }: Props) {
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") ?? 1)
  const pageSize = Number(searchParams.get("pageSize") ?? 10)

  const [reviews, total, avgResult] = await Promise.all([
    prisma.review.findMany({
      where: { resourceId: params.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, phone: true } }
      }
    }),
    prisma.review.count({ where: { resourceId: params.id } }),
    prisma.review.aggregate({
      where: { resourceId: params.id },
      _avg: { rating: true }
    })
  ])

  return NextResponse.json({
    data: reviews,
    total,
    page,
    pageSize,
    averageRating: avgResult._avg.rating ?? null
  })
}

export async function POST(req: Request, { params }: Props) {
  try {
    const user = await requireUser()
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

    if (order.resourceId !== params.id) {
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
        resourceId: params.id,
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
