import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { SERVICE_FEE } from "@/lib/constants";
import { parsePagination } from "@/lib/pagination";
import { toNumberOrNull } from "@/lib/decimal";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "public";

    if (mode === "admin") {
      try {
        await requireAdmin();
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("[Orders Admin Check Error]", error);
        return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
      }

      const { page, pageSize, skip, take } = parsePagination(searchParams);

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
      ]);

      return NextResponse.json({
        data: orders.map((o) => ({
          ...o,
          amount: toNumberOrNull(o.amount),
          finalPrice: toNumberOrNull(o.finalPrice)
        })),
        total,
        page,
        pageSize
      });
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
    return NextResponse.json(
      orders.map((o) => ({
        ...o,
        amount: toNumberOrNull(o.amount),
        finalPrice: toNumberOrNull(o.finalPrice)
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Orders GET Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const {
      resourceId,
      message,
      productLink,
      discountCode,
      finalPrice,
      startDate,
      endDate
    } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, title: true, price: true, status: true }
    });

    if (!resource) {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }

    if (resource.status !== "ACTIVE") {
      return NextResponse.json({ error: "该资源暂不可下单" }, { status: 400 });
    }

    const basePrice = resource.price ? Number(resource.price) : 0;
    const orderAmount = basePrice + SERVICE_FEE;

    const order = await prisma.$transaction(async (tx) => {
      const walletBeforeDeduction = orderAmount > 0
        ? await tx.wallet.findUnique({ where: { userId: user.id } })
        : null;
      const beforeBalance = walletBeforeDeduction ? Number(walletBeforeDeduction.balance) : 0;

      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          resourceId,
          message,
          amount: orderAmount,
          productLink,
          discountCode,
          finalPrice: finalPrice != null ? finalPrice : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status: "PENDING"
        }
      });

      if (orderAmount > 0) {
        const result = await tx.wallet.updateMany({
          where: {
            userId: user.id,
            balance: { gte: orderAmount }
          },
          data: { balance: { decrement: orderAmount } }
        });

        if (result.count === 0) {
          throw new Error("余额不足");
        }

        const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
        const afterBalance = wallet ? Number(wallet.balance) : 0;

        await tx.transaction.create({
          data: {
            walletId: wallet!.id,
            userId: user.id,
            type: "DEDUCTION",
            amount: -orderAmount,
            beforeBalance,
            afterBalance,
            description: `订单扣款 #${newOrder.id.slice(0, 8)}`,
            orderId: newOrder.id
          }
        });
      }

      return newOrder;
    });

    createNotification({
      userId: user.id,
      type: "ORDER_CREATED",
      title: "订单创建成功",
      message: `您的推广订单「${resource.title}」已提交，等待处理中。`,
      orderId: order.id,
      sendEmail: true
    }).catch((err) => console.error("[Order Notification Error]", err));

    return NextResponse.json({ success: true, order: { ...order, amount: toNumberOrNull(order.amount), finalPrice: toNumberOrNull(order.finalPrice) } });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "余额不足") {
        return NextResponse.json({ error: "余额不足" }, { status: 400 });
      }
    }
    return NextResponse.json({ error: "创建订单失败" }, { status: 500 });
  }
}
