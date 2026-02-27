import CartClient from "./CartClient";

export const metadata = { title: "购物车 — GlobalPush" };

export default function CartPage() {
  return (
    <main className="page-container py-12">
      <h1 className="mb-8 text-2xl font-bold">购物车</h1>
      <CartClient />
    </main>
  );
}
