import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderButton from "@/components/OrderButton";
import ResourceReviews from "./ResourceReviews";
import { toNumberOrNull } from "@/lib/decimal";
import { buildMetadata, buildResourceJsonLd } from "@/lib/metadata";
import type { Metadata } from "next";
import { safeJsonLd } from "@/lib/security";

type Props = { params: Promise<{ id: string }> };

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { title: true, description: true, category: true, image: true, status: true },
  });

  if (!resource || resource.status === "HIDDEN") {
    return buildMetadata({ title: "资源未找到 — GlobalPush" });
  }

  return buildMetadata({
    title: `${resource.title} — GlobalPush`,
    description: resource.description.slice(0, 160),
    openGraph: {
      title: `${resource.title} — GlobalPush`,
      description: resource.description.slice(0, 160),
      images: resource.image ? [resource.image] : undefined,
    },
  });
}

export default async function ResourceDetailPage({ params }: Props) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id }
  });

  if (!resource) return notFound();
  if (resource.status === "HIDDEN") return notFound();

  const price = toNumberOrNull(resource.price);

  const reviewStats = await prisma.review.aggregate({
    where: { resourceId: id },
    _avg: { rating: true },
    _count: true
  });

  const jsonLd = buildResourceJsonLd({
    title: resource.title,
    description: resource.description,
    image: resource.image,
    price,
    category: resource.category,
    country: resource.country,
    platform: resource.platform,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
      />
      <div className="page-container py-16">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            {resource.image ? (
              <div className="relative h-56 w-full overflow-hidden rounded-lg border border-white/10">
                <Image src={resource.image} alt={resource.title} fill sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
              </div>
            ) : null}
            <div>
              <span className="text-xs text-muted">{resource.category}</span>
              <h1 className="mt-2 text-4xl font-semibold">{resource.title}</h1>
              {resource.badge ? (
                <span className="mt-3 inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs text-accent">
                  {resource.badge}
                </span>
              ) : null}
            </div>
            <p className="text-base text-white/70">{resource.description}</p>
            <div className="flex flex-wrap gap-2 text-xs text-white/60">
              {resource.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 px-3 py-1">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="mt-10">
              <h2 className="mb-6 text-2xl font-semibold">用户评价</h2>
              {reviewStats._count > 0 && (
                <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
                  <span className="text-lg font-bold text-yellow-400">
                    {reviewStats._avg.rating?.toFixed(1)}
                  </span>
                  <span>/ 5 · 共 {reviewStats._count} 条评价</span>
                </div>
              )}
              <ResourceReviews resourceId={id} />
            </div>
          </div>
          <aside className="card space-y-4">
            <h3 className="text-lg font-semibold">资源信息</h3>
            <div className="space-y-2 text-sm text-white/70">
              <div>国家: {resource.country}</div>
              <div>平台: {resource.platform}</div>
              <div>状态: {resource.status}</div>
              <div>粉丝数: {resource.followers ? resource.followers.toLocaleString() : "暂无"}</div>
              {price !== null && price !== undefined ? (
                <div>{price === 0 ? "价格: 免费" : `参考价: ¥${price.toFixed(2)}`}</div>
              ) : null}
            </div>
            <Link href={resource.link} target="_blank" rel="noopener noreferrer" className="btn w-full">
              访问资源链接
            </Link>
            <div className="pt-2">
              <OrderButton
                resourceId={resource.id}
                resourcePrice={price}
                resourceTitle={resource.title}
                disabled={resource.status === "SOLD_OUT"}
              />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
