import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { serializeResourceSummary } from "@/lib/serializers";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const includeResources = searchParams.get("include") === "resources";

    if (includeResources) {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id, resource: { status: "ACTIVE" } },
        include: { resource: true }
      });

      const resourceIds = favorites.map((fav) => fav.resource.id);
      const reviewStats = await prisma.review.groupBy({
        by: ["resourceId"],
        where: { resourceId: { in: resourceIds } },
        _avg: { rating: true },
        _count: true
      });

      const statsMap = new Map(
        reviewStats.map((s) => [
          s.resourceId,
          { averageRating: s._avg.rating, reviewCount: s._count }
        ])
      );

      return NextResponse.json({
        resources: favorites.map((fav) => {
          const stats = statsMap.get(fav.resource.id);
          return {
            ...serializeResourceSummary(fav.resource),
            averageRating: stats?.averageRating ?? null,
            reviewCount: stats?.reviewCount ?? 0
          };
        })
      });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id, resource: { status: "ACTIVE" } }
    });
    return NextResponse.json(favorites.map((fav) => fav.resourceId));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("[Favorites GET Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { resourceId } = await request.json();
    if (typeof resourceId !== "string" || resourceId.length < 1 || resourceId.length > 100) {
      return new NextResponse("Missing resourceId", { status: 400 });
    }
    const existing = await prisma.favorite.findUnique({
      where: { userId_resourceId: { userId: user.id, resourceId } }
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true });
    }
    const resource = await prisma.resource.findFirst({ where: { id: resourceId, status: "ACTIVE" }, select: { id: true } });
    if (!resource) return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    await prisma.favorite.create({
      data: { userId: user.id, resourceId }
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    console.error("[Favorites POST Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
