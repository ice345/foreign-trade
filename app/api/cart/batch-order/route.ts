import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { createNotification, notifyAdmins } from "@/lib/notifications"
import { batchOrderSchema } from "@/lib/validations/order"

export async function POST(req: Request) {
  try {
    const user = await requireUser()
    const parsed = batchOrderSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const items = parsed.data.items
    const resourceIds = items.map((item) => item.resourceId)
    const uniqueResourceIds = Array.from(new Set(resourceIds))
    if (uniqueResourceIds.length !== resourceIds.length) {
      return NextResponse.json({ error: "不能重复提交同一资源" }, { status: 400 })
    }

    const resources = await prisma.resource.findMany({
      where: { id: { in: uniqueResourceIds }, status: "ACTIVE" },
      select: { id: true, title: true, price: true }
    })
    if (resources.length !== uniqueResourceIds.length) {
      return NextResponse.json({ error: "部分资源不存在或暂不可询价" }, { status: 400 })
    }

    const resourceMap = new Map(resources.map((resource) => [resource.id, resource]))
    const orders = await prisma.$transaction(async (tx) => {
      const created = []
      for (const item of items) {
        const resource = resourceMap.get(item.resourceId)!
        const order = await tx.order.create({
          data: {
            userId: user.id,
            resourceId: resource.id,
            resourceTitle: resource.title,
            resourcePrice: resource.price,
            message: item.message ?? null,
            productLink: item.productLink || null,
            discountCode: item.discountCode || null,
            finalPrice: item.finalPrice ?? null,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
            amount: null,
            status: "PENDING"
          }
        })
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "ORDER_INQUIRY_CREATED",
            entityType: "Order",
            entityId: order.id,
            after: { status: "PENDING", resourceId: resource.id }
          }
        })
        created.push({ id: order.id, title: resource.title })
      }
      await tx.cartItem.deleteMany({
        where: { userId: user.id, resourceId: { in: uniqueResourceIds } }
      })
      return created
    })

    for (const order of orders) {
      createNotification({
        userId: user.id,
        type: "ORDER_CREATED",
        title: "推广需求已提交",
        message: `我们已收到「${order.title}」推广需求，确认方案后会向您报价。`,
        orderId: order.id
      }).catch(() => undefined)
    }
    notifyAdmins({
      type: "ORDER_CREATED",
      title: "新的批量推广询价",
      message: `用户提交了 ${orders.length} 个推广需求。`,
      sendEmail: true
    }).catch(() => undefined)

    return NextResponse.json({ success: true, orderCount: orders.length })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[Batch Inquiry Error]", error)
    return NextResponse.json({ error: "批量提交失败" }, { status: 500 })
  }
}
