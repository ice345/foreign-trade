import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

type Props = { params: { id: string } };

export async function GET(_: Request, { params }: Props) {
  const resource = await prisma.resource.findUnique({ where: { id: params.id } });
  if (!resource) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({
    ...resource,
    createdAt: resource.createdAt.toISOString()
  });
}

export async function PUT(request: Request, { params }: Props) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        country: payload.country,
        tags: payload.tags ?? [],
        platform: payload.platform,
        link: payload.link,
        image: payload.image,
        price: payload.price ?? null,
        badge: payload.badge ?? null,
        followers: payload.followers ?? null,
        status: payload.status ?? "ACTIVE"
      }
    });
    return NextResponse.json(resource);
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    await requireAdmin();
    await prisma.resource.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }
}
