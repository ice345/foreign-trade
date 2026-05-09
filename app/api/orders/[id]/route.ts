import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { updateOrderSchema } from "@/lib/validations/order";

type Props = { params: Promise<{ id: string }> };

const statusLabels: Record<string, string> = {
  PENDING: "待处理",
  RUNNING: "执行中",
  POSTED: "已发布",
  CONFIRMED: "已确认",
  CANCELLED: "已取消",
  REFUNDED: "已退款"
};

export async function PUT(req: Request, { params }: Props) {
  try {
    await requireAdmin();
    const { id } = await params;
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
      where: { id },
      select: { status: true, userId: true, resourceId: true }
    });

    if (!oldOrder) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id },
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
      }).catch((err) => console.error("[Order Status Notification Error]", err));
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

export async function DELETE(req: Request, { params }: Props) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    let cancelReason = "管理员取消订单";
    try {
      const body = await req.json();
      if (typeof body?.reason === "string" && body.reason.trim()) {
        cancelReason = body.reason.trim().slice(0, 500);
      }
    } catch {
      // DELETE may be sent without a JSON body.
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        resource: { select: { title: true } },
        transactions: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "CONFIRMED") {
      return NextResponse.json({ error: "已确认订单不能取消，请走售后退款流程" }, { status: 400 });
    }

    if (order.status === "CANCELLED" || order.status === "REFUNDED") {
      return NextResponse.json({ error: "订单已取消" }, { status: 400 });
    }

    const orderAmount = order.amount ? Number(order.amount) : 0;
    let refunded = false;

    await prisma.$transaction(async (tx) => {
      if (orderAmount > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
        if (!wallet) {
          throw new Error("WALLET_NOT_FOUND");
        }

        const beforeBalance = Number(wallet.balance);
        const updatedWallet = await tx.wallet.update({
          where: { userId: order.userId },
          data: { balance: { increment: orderAmount } }
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: order.userId,
            type: "REFUND",
            amount: orderAmount,
            beforeBalance,
            afterBalance: Number(updatedWallet.balance),
            description: `订单取消退款 #${order.id.slice(0, 8)}`,
            orderId: order.id,
            adminId: admin.id
          }
        });
        refunded = true;
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: refunded ? "REFUNDED" : "CANCELLED",
          cancelledAt: new Date(),
          cancelReason,
          cancelledById: admin.id
        }
      });
    });

    createNotification({
      userId: order.userId,
      type: "SYSTEM",
      title: refunded ? "订单已取消并退款" : "订单已取消",
      message: `您的订单「${order.resource?.title ?? ""}」已取消。${refunded ? `已退款 ¥${orderAmount.toFixed(2)}。` : ""}原因：${cancelReason}`,
      sendEmail: true
    }).catch((err) => console.error("[Order Delete Notification Error]", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (error.message === "WALLET_NOT_FOUND") {
        return NextResponse.json({ error: "钱包不存在，无法退款" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "取消订单失败" }, { status: 500 });
  }
}
