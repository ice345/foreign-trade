import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Prisma, Resource, ResourceStatus } from "@prisma/client";
import { createResourceSchema } from "@/lib/validations/resource";
import { parsePagination } from "@/lib/pagination";
import { serializeResource, serializeResourceSummary } from "@/lib/serializers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const country = searchParams.get("country") ?? "";
  const status = searchParams.get("status") ?? "";
  const { page, pageSize, skip, take } = parsePagination(searchParams, { pageSize: 12 });
  const mode = searchParams.get("mode") ?? "public";
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

  const shouldUseFullText = q.length > 0;

  const orderBy =
    sort === "title"
      ? Prisma.raw(`"title"`)
      : sort === "category"
        ? Prisma.raw(`"category"`)
        : Prisma.raw(`"createdAt"`);
  const orderDirection = direction === "asc" ? Prisma.raw("ASC") : Prisma.raw("DESC");

  let data: Resource[] = [];
  let total = 0;

  if (shouldUseFullText) {
    let conditionsSql = Prisma.sql`to_tsvector('simple', "title" || ' ' || "description" || ' ' || coalesce(array_to_string("tags", ' '), '')) @@ plainto_tsquery('simple', ${q})`;

    if (category) conditionsSql = Prisma.sql`${conditionsSql} AND "category" = ${category}`;
    if (platform) conditionsSql = Prisma.sql`${conditionsSql} AND "platform" = ${platform}`;
    if (country) conditionsSql = Prisma.sql`${conditionsSql} AND "country" = ${country}`;

    if (status) {
      conditionsSql = Prisma.sql`${conditionsSql} AND "status" = ${status}`;
    } else if (mode === "public") {
      conditionsSql = Prisma.sql`${conditionsSql} AND "status" = 'ACTIVE'`;
    }

    const whereSql = Prisma.sql`WHERE ${conditionsSql}`;
    const orderSql = Prisma.sql`ORDER BY ${orderBy} ${orderDirection}`;

    const [rows, counts] = await Promise.all([
      prisma.$queryRaw<Resource[]>(Prisma.sql`SELECT * FROM "Resource" ${whereSql} ${orderSql} LIMIT ${take} OFFSET ${skip}`),
      prisma.$queryRaw<{ count: number }[]>(Prisma.sql`SELECT COUNT(*)::int as count FROM "Resource" ${whereSql}`)
    ]);
    data = rows;
    total = Number(counts?.[0]?.count ?? 0);
  } else {
    const where = {
      AND: [
        category ? { category } : {},
        platform ? { platform } : {},
        country ? { country } : {},
        status ? { status: status as ResourceStatus } : mode === "public" ? { status: ResourceStatus.ACTIVE } : {}
      ]
    };

    const [rows, counts] = await Promise.all([
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
    data = rows;
    total = counts;
  }

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
    await requireAdmin();
    const payload = await request.json();
    const parsed = createResourceSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const resource = await prisma.resource.create({
      data: {
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
        categoryId: data.categoryId ?? null
      }
    });
    return NextResponse.json(serializeResource(resource));
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "创建资源失败" }, { status: 500 });
  }
}
