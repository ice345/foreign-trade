import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { deductBalance } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "public";

    if (mode === "admin") {
      try {
        await requireAdmin();
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const orders = await prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          resource: { select: { id: true, title: true } },
          user: { select: { id: true, email: true, phone: true } }
        }
      });
      return NextResponse.json(orders);
    }

    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        resource: { select: { id: true, title: true } },
        user: { select: { id: true, email: true, phone: true } }
      }
    });
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const {
      resourceId,
      message,
      amount,
      productLink,
      discountCode,
      finalPrice,
      startDate,
      endDate
    } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    const orderAmount = amount || 0;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          resourceId,
          message,
          amount: orderAmount,
          productLink,
          discountCode,
          finalPrice: finalPrice ?? null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: "PENDING"
        }
      });

      if (orderAmount > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
        if (!wallet || wallet.balance < orderAmount) {
          throw new Error("余额不足");
        }

        await tx.wallet.update({
          where: { userId: user.id },
          data: { balance: { decrement: orderAmount } }
        });

        await tx.transaction.create({
          data: {
            walletId: wallet.id,
            userId: user.id,
            type: "DEDUCTION",
            amount: -orderAmount,
            description: `订单扣款 #${newOrder.id.slice(0, 8)}`,
            orderId: newOrder.id
          }
        });
      }

      return newOrder;
    });

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { title: true }
    });

    await createNotification({
      userId: user.id,
      type: "ORDER_CREATED",
      title: "订单创建成功",
      message: `您的推广订单「${resource?.title ?? ""}」已提交，等待处理中。`,
      orderId: order.id,
      sendEmail: true
    }).catch(() => {});

    return NextResponse.json({ success: true, order });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "余额不足") {
        return NextResponse.json({ error: "余额不足" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
