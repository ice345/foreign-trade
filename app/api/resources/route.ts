import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Prisma, Resource } from "@prisma/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const platform = searchParams.get("platform") ?? "";
  const country = searchParams.get("country") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 12);
  const mode = searchParams.get("mode") ?? "public";
  const sort = searchParams.get("sort") ?? "createdAt";
  const direction = searchParams.get("direction") === "asc" ? "asc" : "desc";

  if (mode === "admin") {
    try {
      await requireAdmin();
    } catch {
      return new NextResponse("Unauthorized", { status: 401 });
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
    const offset = (page - 1) * pageSize;

    const [rows, counts] = await Promise.all([
      prisma.$queryRaw<Resource[]>(Prisma.sql`SELECT * FROM "Resource" ${whereSql} ${orderSql} LIMIT ${pageSize} OFFSET ${offset}`),
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
        status ? { status } : mode === "public" ? { status: "ACTIVE" } : {}
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
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      prisma.resource.count({ where })
    ]);
    data = rows;
    total = counts;
  }

  if (mode === "admin") {
    return NextResponse.json({ data, total, page, pageSize });
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
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        country: item.country,
        platform: item.platform,
        status: item.status,
        image: item.image,
        price: item.price,
        badge: item.badge,
        followers: item.followers,
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
    const resource = await prisma.resource.create({
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
