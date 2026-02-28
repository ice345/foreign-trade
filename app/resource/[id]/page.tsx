import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OrderButton from "@/components/OrderButton";
import ResourceReviews from "./ResourceReviews";
import { toNumberOrNull } from "@/lib/decimal";

type Props = { params: { id: string } };

export default async function ResourceDetailPage({ params }: Props) {
  const resource = await prisma.resource.findUnique({
    where: { id: params.id }
  });

  if (!resource) return notFound();

  const price = toNumberOrNull(resource.price as any);

  const reviewStats = await prisma.review.aggregate({
    where: { resourceId: params.id },
    _avg: { rating: true },
    _count: true
  });

  return (
    <div className="page-container py-16">
      <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {resource.image ? (
            <div
              className="h-56 w-full rounded-3xl border border-white/10 bg-cover bg-center"
              style={{ backgroundImage: `url(${resource.image})` }}
            />
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
            <ResourceReviews resourceId={params.id} />
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
          <Link href={resource.link} target="_blank" className="btn w-full">
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
  );
}
