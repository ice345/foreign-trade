import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin, requireUser } from "@/lib/auth"
import { createNotification, notifyAdmins } from "@/lib/notifications"
import { parsePagination } from "@/lib/pagination"
import { toNumberOrNull } from "@/lib/decimal"
import { createOrderSchema } from "@/lib/validations/order"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get("mode") ?? "public"

    if (mode === "admin") {
      await requireAdmin()
      const { page, pageSize, skip, take } = parsePagination(searchParams)
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          orderBy: { createdAt: "desc" },
          skip,
          take,
          include: {
            resource: { select: { id: true, title: true } },
            user: { select: { id: true, email: true, phone: true } }
          }
        }),
        prisma.order.count()
      ])
      return NextResponse.json({
        data: orders.map(serializeOrder),
        total,
        page,
        pageSize
      })
    }

    const user = await requireUser()
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { resource: { select: { id: true, title: true } } }
    })
    return NextResponse.json(orders.map(serializeOrder))
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("[Orders GET Error]", error)
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 })
  }
}

function serializeOrder<T extends {
  amount: unknown
  resourcePrice: unknown
  finalPrice: unknown
}>(order: T) {
  return {
    ...order,
    amount: toNumberOrNull(order.amount as never),
    resourcePrice: toNumberOrNull(order.resourcePrice as never),
    finalPrice: toNumberOrNull(order.finalPrice as never)
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const parsed = createOrderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const data = parsed.data
    const resource = await prisma.resource.findFirst({
      where: { id: data.resourceId, status: "ACTIVE" },
      select: { id: true, title: true, price: true }
    })
    if (!resource) {
      return NextResponse.json({ error: "资源不存在或暂不可询价" }, { status: 404 })
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        resourceId: resource.id,
        resourceTitle: resource.title,
        resourcePrice: resource.price,
        message: data.message ?? null,
        productLink: data.productLink || null,
        discountCode: data.discountCode || null,
        finalPrice: data.finalPrice ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        amount: null,
        status: "PENDING"
      }
    })

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "ORDER_INQUIRY_CREATED",
        entityType: "Order",
        entityId: order.id,
        after: { status: "PENDING", resourceId: resource.id }
      }
    })

    createNotification({
      userId: user.id,
      type: "ORDER_CREATED",
      title: "推广需求已提交",
      message: `我们已收到「${resource.title}」推广需求，确认可执行方案后会向您报价。`,
      orderId: order.id,
      sendEmail: true
    }).catch((error) => console.error("[Order Notification Error]", error))

    notifyAdmins({
      type: "ORDER_CREATED",
      title: "新的推广询价",
      message: `用户提交了「${resource.title}」推广需求。`,
      orderId: order.id,
      sendEmail: true
    }).catch((error) => console.error("[Order Admin Notification Error]", error))

    return NextResponse.json({ success: true, order: serializeOrder(order) })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Order Create Error]", error)
    return NextResponse.json({ error: "创建推广需求失败" }, { status: 500 })
  }
}
