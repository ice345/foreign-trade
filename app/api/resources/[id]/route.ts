import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { updateResourceSchema } from "@/lib/validations/resource";
import { serializeResource } from "@/lib/serializers";

type Props = { params: { id: string } };

export async function GET(_: Request, { params }: Props) {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: params.id } });
    if (!resource) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(serializeResource(resource));
  } catch (error) {
    console.error("[Resource GET Error]", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: Props) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const parsed = updateResourceSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const resource = await prisma.resource.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.platform !== undefined && { platform: data.platform }),
        ...(data.link !== undefined && { link: data.link }),
        ...(data.image !== undefined && { image: data.image ?? null }),
        ...(data.price !== undefined && { price: data.price ?? null }),
        ...(data.badge !== undefined && { badge: data.badge ?? null }),
        ...(data.followers !== undefined && { followers: data.followers ?? null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId ?? null })
      }
    });
    return NextResponse.json(serializeResource(resource));
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "更新资源失败" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Props) {
  try {
    await requireAdmin();
    await prisma.resource.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "删除资源失败" }, { status: 500 });
  }
}
