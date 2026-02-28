import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            description: true,
            category: true,
            country: true,
            platform: true,
            status: true,
            image: true,
            price: true,
            badge: true,
            followers: true
          }
        }
      }
    });
    return NextResponse.json(
      items.map((item) => ({
        ...item,
        resource: {
          ...item.resource,
          price: item.resource.price ? Number(item.resource.price) : null
        }
      }))
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { resourceId } = await req.json();

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    await prisma.cartItem.upsert({
      where: { userId_resourceId: { userId: user.id, resourceId } },
      create: { userId: user.id, resourceId },
      update: {}
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to add to cart" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!resourceId) {
      return NextResponse.json({ error: "resourceId is required" }, { status: 400 });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: user.id, resourceId }
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove from cart" }, { status: 500 });
  }
}
