import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { updateResourceSchema } from "@/lib/validations/resource";
import { serializeResource } from "@/lib/serializers";
import { isInternalFileUrl } from "@/lib/security";
import { fileIdFromUrl, validateFileReference } from "@/lib/storage";

type Props = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Props) {
  try {
    const { id } = await params;
    const resource = await prisma.resource.findFirst({ where: { id, status: "ACTIVE" } });
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
    const admin = await requireAdmin();
    const { id } = await params;
    const payload = await request.json();
    const parsed = updateResourceSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const current = await prisma.resource.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    if (data.image && !isInternalFileUrl(data.image) && data.image !== current.image) {
      return NextResponse.json({ error: "资源图片必须通过本站上传" }, { status: 400 });
    }
    if (data.image && isInternalFileUrl(data.image)) {
      const validFile = await validateFileReference({ url: data.image, purposes: ["RESOURCE_IMAGE"] });
      if (!validFile) return NextResponse.json({ error: "资源图片不可用" }, { status: 400 });
    }
    const resource = await prisma.$transaction(async (tx) => {
      const updated = await tx.resource.update({ where: { id }, data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.platform !== undefined && { platform: data.platform }),
        ...(data.link !== undefined && { link: data.link }),
        ...(data.image !== undefined && {
          image: data.image ?? null,
          imageFileId: data.image && isInternalFileUrl(data.image) ? fileIdFromUrl(data.image) : null
        }),
        ...(data.price !== undefined && { price: data.price ?? null }),
        ...(data.badge !== undefined && { badge: data.badge ?? null }),
        ...(data.followers !== undefined && { followers: data.followers ?? null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId ?? null }),
        ...(data.leadTimeDays !== undefined && { leadTimeDays: data.leadTimeDays ?? null })
      } });
      await tx.auditLog.create({ data: {
        actorId: admin.id,
        action: "RESOURCE_UPDATED",
        entityType: "Resource",
        entityId: id,
        before: { title: current.title, status: current.status },
        after: { title: updated.title, status: updated.status }
      } });
      return updated;
    });
    return NextResponse.json(serializeResource(resource));
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "更新资源失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const admin = await requireAdmin();
    const { id } = await params;
    let reason = "管理员隐藏资源";
    try {
      const body = await request.json();
      if (typeof body.reason === "string" && body.reason.trim()) reason = body.reason.trim().slice(0, 500);
    } catch {
      // Existing clients may send an empty DELETE request.
    }
    await prisma.$transaction(async (tx) => {
      const current = await tx.resource.findUnique({ where: { id } });
      if (!current) throw new Error("NOT_FOUND");
      await tx.resource.update({ where: { id }, data: { status: "HIDDEN" } });
      await tx.auditLog.create({ data: {
        actorId: admin.id,
        action: "RESOURCE_HIDDEN",
        entityType: "Resource",
        entityId: id,
        before: { status: current.status },
        after: { status: "HIDDEN" },
        reason
      } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "资源不存在" }, { status: 404 });
    }
    return NextResponse.json({ error: "隐藏资源失败" }, { status: 500 });
  }
}
