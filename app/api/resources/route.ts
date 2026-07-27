import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createResourceSchema } from "@/lib/validations/resource";
import { parsePagination } from "@/lib/pagination";
import { serializeResource, serializeResourceSummary } from "@/lib/serializers";
import { isInternalFileUrl } from "@/lib/security";
import { fileIdFromUrl, validateFileReference } from "@/lib/storage";
import { parseOptionalLeadTime, parseOptionalMaxPrice } from "@/lib/resource-filters";
import { buildResourceWhere } from "@/lib/resource-query";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 100);
  const category = (searchParams.get("category") ?? "").slice(0, 100);
  const platform = (searchParams.get("platform") ?? "").slice(0, 100);
  const country = (searchParams.get("country") ?? "").slice(0, 100);
  const goal = (searchParams.get("goal") ?? "").slice(0, 40);
  const { page, pageSize, skip, take } = parsePagination(searchParams, { pageSize: 12 });
  const mode = searchParams.get("mode") ?? "public";
  const requestedStatus = searchParams.get("status") ?? "";
  const status = mode === "admin" && ["ACTIVE", "HIDDEN", "SOLD_OUT"].includes(requestedStatus)
    ? requestedStatus
    : "";
  const maxPrice = parseOptionalMaxPrice(searchParams.get("maxPrice"));
  const leadTime = parseOptionalLeadTime(searchParams.get("leadTime"));
  const sort = searchParams.get("sort") ?? "createdAt";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

  if (mode === "admin") {
    try {
      await requireAdmin();
    } catch (error) {
      if (error instanceof Error && error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      console.error("[Resources Admin Check Error]", error);
      return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
    }
  }

  const where = buildResourceWhere({
    q,
    category,
    platform,
    country,
    goal,
    maxPrice,
    leadTime,
    mode,
    status
  });

  const [data, total] = await Promise.all([
    prisma.resource.findMany({
      where,
      orderBy:
        sort === "title"
          ? { title: direction }
          : sort === "category"
            ? { category: direction }
            : { createdAt: direction },
      skip,
      take
    }),
    prisma.resource.count({ where })
  ]);

  if (mode === "admin") {
    return NextResponse.json({
      data: data.map(serializeResource),
      total,
      page,
      pageSize
    });
  }

  const resourceIds = data.map((item) => item.id);
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
    data: data.map((item) => {
      const stats = statsMap.get(item.id);
      return {
        ...serializeResourceSummary(item),
        averageRating: stats?.averageRating ?? null,
        reviewCount: stats?.reviewCount ?? 0
      };
    }),
    total,
    page,
    pageSize
  });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const payload = await request.json();
    const parsed = createResourceSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.image && !isInternalFileUrl(data.image)) {
      return NextResponse.json({ error: "资源图片必须通过本站上传" }, { status: 400 });
    }
    if (data.image) {
      const validFile = await validateFileReference({ url: data.image, purposes: ["RESOURCE_IMAGE"] });
      if (!validFile) return NextResponse.json({ error: "资源图片不可用" }, { status: 400 });
    }
    const resource = await prisma.$transaction(async (tx) => {
      const created = await tx.resource.create({ data: {
        title: data.title,
        description: data.description,
        category: data.category,
        country: data.country,
        tags: data.tags,
        platform: data.platform,
        link: data.link,
        image: data.image ?? null,
        price: data.price ?? null,
        badge: data.badge ?? null,
        followers: data.followers ?? null,
        status: data.status,
        categoryId: data.categoryId ?? null,
        imageFileId: data.image ? fileIdFromUrl(data.image) : null,
        leadTimeDays: data.leadTimeDays ?? null
      } });
      await tx.auditLog.create({ data: {
        actorId: admin.id,
        action: "RESOURCE_CREATED",
        entityType: "Resource",
        entityId: created.id,
        after: { title: created.title, status: created.status }
      } });
      return created;
    });
    return NextResponse.json(serializeResource(resource));
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "创建资源失败" }, { status: 500 });
  }
}
