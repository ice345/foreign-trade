import OrderAdminTable from "@/components/admin/OrderAdminTable";

export default function AdminOrdersPage() {
  return (
    <div className="page-container py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">订单管理</h1>
        <p className="text-sm text-white/60">更新订单状态，上传截图与发帖链接。</p>
      </div>
      <OrderAdminTable />
    </div>
  );
}
