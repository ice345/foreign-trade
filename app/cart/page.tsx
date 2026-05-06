import CartClient from "./CartClient";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "购物车 — GlobalPush",
  description: "管理你的推广资源购物车，批量下单。",
  robots: { index: false, follow: false },
});

export default function CartPage() {
  return (
    <main className="page-container py-12">
      <h1 className="mb-8 text-2xl font-bold">购物车</h1>
      <CartClient />
    </main>
  );
}
