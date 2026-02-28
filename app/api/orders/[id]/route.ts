import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { updateOrderSchema } from "@/lib/validations/order";

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
    const parsed = updateOrderSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const oldOrder = await prisma.order.findUnique({
      where: { id: params.id },
      select: { status: true, userId: true, resourceId: true }
    });

    if (!oldOrder) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.postLink !== undefined && { postLink: data.postLink ?? null }),
        ...(data.screenshotUrl !== undefined && { screenshotUrl: data.screenshotUrl ?? null })
      },
      include: { resource: { select: { title: true } } }
    });

    if (data.status && oldOrder.status !== data.status) {
      createNotification({
        userId: order.userId,
        type: "ORDER_STATUS",
        title: "订单状态更新",
        message: `您的订单「${order.resource?.title ?? ""}」状态已更新为：${statusLabels[data.status] ?? data.status}`,
        orderId: order.id,
        sendEmail: true
      }).catch(() => {});
    }

    return NextResponse.json(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "更新订单失败" }, { status: 500 });
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

    const orderAmount = order.amount ? Number(order.amount) : 0;

    await prisma.$transaction(async (tx) => {
      if (orderAmount > 0 && order.status !== "CONFIRMED") {
        const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
        if (wallet) {
          await tx.wallet.update({
            where: { userId: order.userId },
            data: { balance: { increment: orderAmount } }
          });

          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              userId: order.userId,
              type: "REFUND",
              amount: orderAmount,
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

    createNotification({
      userId: order.userId,
      type: "SYSTEM",
      title: "订单已删除",
      message: `您的订单「${order.resource?.title ?? ""}」已被管理员删除。${orderAmount > 0 && order.status !== "CONFIRMED" ? `已退款 ¥${orderAmount.toFixed(2)}` : ""}`,
      sendEmail: true
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "删除订单失败" }, { status: 500 });
  }
}
