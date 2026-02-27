import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const includeResources = searchParams.get("include") === "resources";

    if (includeResources) {
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        include: { resource: true }
      });
      return NextResponse.json({
        resources: favorites.map((fav) => ({
          id: fav.resource.id,
          title: fav.resource.title,
          description: fav.resource.description,
          category: fav.resource.category,
          country: fav.resource.country,
          platform: fav.resource.platform,
          status: fav.resource.status,
          image: fav.resource.image,
          price: fav.resource.price,
          badge: fav.resource.badge,
          followers: fav.resource.followers
        }))
      });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id }
    });
    return NextResponse.json(favorites.map((fav) => fav.resourceId));
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { resourceId } = await request.json();
    if (!resourceId) return new NextResponse("Missing resourceId", { status: 400 });
    const existing = await prisma.favorite.findUnique({
      where: { userId_resourceId: { userId: user.id, resourceId } }
    });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ ok: true });
    }
    await prisma.favorite.create({
      data: { userId: user.id, resourceId }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}
