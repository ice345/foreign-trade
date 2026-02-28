"use client"

import PaymentManager from "./PaymentManager"

export default function PaymentsPage() {
  return (
    <div className="page-container py-10">
      <h1 className="mb-8 text-3xl font-semibold">支付管理</h1>
      <PaymentManager />
    </div>
  )
}
