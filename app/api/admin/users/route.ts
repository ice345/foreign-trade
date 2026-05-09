import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { parsePagination } from "@/lib/pagination";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip, take } = parsePagination(searchParams);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take,
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          nickname: true,
          deletedAt: true,
          deletedReason: true,
          createdAt: true,
          wallet: { select: { balance: true } }
        }
      }),
      prisma.user.count()
    ]);

    return NextResponse.json({
      data: users.map((u) => ({
        ...u,
        balance: u.wallet ? Number(u.wallet.balance) : 0
      })),
      total,
      page,
      pageSize
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}
