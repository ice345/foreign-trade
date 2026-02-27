import AdminResourceTable from "@/components/admin/AdminResourceTable";

export default function AdminResourcesPage() {
  return (
    <div className="page-container py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">资源管理</h1>
          <p className="text-sm text-white/60">创建、编辑、排序并切换资源状态。</p>
        </div>
      </div>
      <AdminResourceTable />
    </div>
  );
}
