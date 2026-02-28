import { prisma } from "@/lib/prisma";
import AdminResourceEditor from "./AdminResourceEditor";
import { notFound } from "next/navigation";
import { toNumberOrNull } from "@/lib/decimal";

type Props = { params: { id: string } };

export default async function AdminResourcePage({ params }: Props) {
  const resource = await prisma.resource.findUnique({
    where: { id: params.id }
  });

  if (!resource) return notFound();

  return (
    <div className="page-container py-16 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">编辑资源</h1>
        <p className="text-sm text-white/60">更新资源详情与显示状态。</p>
      </div>
      <AdminResourceEditor
        resource={{
          ...resource,
          price: toNumberOrNull(resource.price as any),
          createdAt: resource.createdAt.toISOString(),
          status: resource.status as "ACTIVE" | "HIDDEN"
        }}
      />
    </div>
  );
}
