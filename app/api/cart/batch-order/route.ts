import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { SERVICE_FEE } from "@/lib/constants";
import { toNumberOrNull } from "@/lib/decimal";

type BatchItem = {
  resourceId: string;
  productLink?: string;
  discountCode?: string;
  finalPrice?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  message?: string;
};

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { items } = (await req.json()) as { items: BatchItem[] };

    if (!items?.length) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }

    const resourceIds = items.map((i) => i.resourceId);
    const resources = await prisma.resource.findMany({
      where: { id: { in: resourceIds } },
      select: { id: true, title: true, price: true }
    });
    const resourceMap = new Map(resources.map((r) => [r.id, r]));

    let totalAmount = 0;
    for (const item of items) {
      const resource = resourceMap.get(item.resourceId);
      if (!resource) continue;
      const basePrice = resource.price ? Number(resource.price) : 0;
      totalAmount += basePrice + SERVICE_FEE;
    }

    const createdOrders = await prisma.$transaction(async (tx) => {
      if (totalAmount > 0) {
        const result = await tx.wallet.updateMany({
          where: {
            userId: user.id,
            balance: { gte: totalAmount }
          },
          data: { balance: { decrement: totalAmount } }
        });

        if (result.count === 0) {
          throw new Error("余额不足");
        }
      }

      const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
      const orders: { id: string; resourceTitle: string }[] = [];

      for (const item of items) {
        const resource = resourceMap.get(item.resourceId);
        if (!resource) continue;

        const basePrice = resource.price ? Number(resource.price) : 0;
        const amount = basePrice + SERVICE_FEE;

        const newOrder = await tx.order.create({
          data: {
            userId: user.id,
            resourceId: item.resourceId,
            message: item.message ?? null,
            amount,
            productLink: item.productLink ?? null,
            discountCode: item.discountCode ?? null,
            finalPrice: item.finalPrice ?? null,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
            status: "PENDING"
          }
        });

        if (amount > 0 && wallet) {
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              userId: user.id,
              type: "DEDUCTION",
              amount: -amount,
              description: `订单扣款 #${newOrder.id.slice(0, 8)}`,
              orderId: newOrder.id
            }
          });
        }

        orders.push({ id: newOrder.id, resourceTitle: resource.title });
      }

      await tx.cartItem.deleteMany({
        where: { userId: user.id, resourceId: { in: resourceIds } }
      });

      return orders;
    });

    for (const order of createdOrders) {
      createNotification({
        userId: user.id,
        type: "ORDER_CREATED",
        title: "订单创建成功",
        message: `您的推广订单「${order.resourceTitle}」已提交，等待处理中。`,
        orderId: order.id,
        sendEmail: true
      }).catch(() => {});
    }

    const orderSummary = createdOrders.map((o) => o.resourceTitle).join("、")
    notifyAdmins({
      type: "ORDER_CREATED",
      title: "新订单通知",
      message: `用户提交了 ${createdOrders.length} 个新订单：${orderSummary}`,
      sendEmail: true
    }).catch(() => {})

    return NextResponse.json({ success: true, orderCount: createdOrders.length });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "余额不足") {
        return NextResponse.json({ error: "余额不足" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "批量下单失败" }, { status: 500 });
  }
}
