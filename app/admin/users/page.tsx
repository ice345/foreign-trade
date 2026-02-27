import UserWalletManager from "@/components/admin/UserWalletManager";

export default function AdminUsersPage() {
  return (
    <div className="page-container py-16">
      <h1 className="mb-8 text-3xl font-semibold">用户管理</h1>
      <UserWalletManager />
    </div>
  );
}
