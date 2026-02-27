import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

type Props = { params: { id: string } };

const statusLabels: Record<string, string> = {
  PENDING: "待处理",
  RUNNING: "执行中",
  POSTED: "已发布",
  CONFIRMED: "已确认"
};

export async function PUT(req: Request, { params }: Props) {
  try {
    await requireAdmin();
    const payload = await req.json();

    const oldOrder = await prisma.order.findUnique({
      where: { id: params.id },
      select: { status: true, userId: true, resourceId: true }
    });

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: payload.status,
        postLink: payload.postLink ?? null,
        screenshotUrl: payload.screenshotUrl ?? null
      },
      include: { resource: { select: { title: true } } }
    });

    if (oldOrder && payload.status && oldOrder.status !== payload.status) {
      await createNotification({
        userId: order.userId,
        type: "ORDER_STATUS",
        title: "订单状态更新",
        message: `您的订单「${order.resource.title}」状态已更新为：${statusLabels[payload.status] ?? payload.status}`,
        orderId: order.id,
        sendEmail: true
      }).catch(() => {});
    }

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Props) {
  try {
    await requireAdmin();

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        resource: { select: { title: true } },
        transactions: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (order.amount && order.amount > 0 && order.status !== "CONFIRMED") {
        const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
        if (wallet) {
          await tx.wallet.update({
            where: { userId: order.userId },
            data: { balance: { increment: order.amount } }
          });

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              userId: order.userId,
              type: "REFUND",
              amount: order.amount,
              description: `订单删除退款 #${order.id.slice(0, 8)}`,
              orderId: order.id
            }
          });
        }
      }

      await tx.notification.deleteMany({ where: { orderId: order.id } });
      await tx.transaction.deleteMany({ where: { orderId: order.id } });
      await tx.review.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });
    });

    await createNotification({
      userId: order.userId,
      type: "SYSTEM",
      title: "订单已删除",
      message: `您的订单「${order.resource.title}」已被管理员删除。${order.amount && order.amount > 0 && order.status !== "CONFIRMED" ? `已退款 ¥${order.amount.toFixed(2)}` : ""}`,
      sendEmail: true
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
