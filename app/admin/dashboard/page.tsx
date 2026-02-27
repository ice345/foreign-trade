import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  return (
    <div className="page-container py-16">
      <h1 className="mb-8 text-3xl font-semibold">数据面板</h1>
      <DashboardClient />
    </div>
  );
}
